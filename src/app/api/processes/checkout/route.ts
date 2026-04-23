// API Route - Creation session Checkout pour demarche unique

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { generateReference } from '@/lib/utils';
import { recordConsent } from '@/lib/consent';
import {
  PROCESS_TYPES_CONFIG,
  getProcessTypeSlug,
  getRequiredDocuments,
} from '@/lib/process-types';
import { calculateRegistrationTaxes } from '@/lib/taxes/registration-certificate';
import { calculateStampTax } from '@/types/identity-card';
import { processCheckoutSchema } from '@/schemas/process';
import { checkProcessEligibility } from '@/lib/subscription/process-eligibility';
import { getDefaultPSPAdapter } from '@/lib/psp';
import type { CheckoutLineItem } from '@/lib/psp/types';
import type { ProcessType } from '@prisma/client';

// POST /api/processes/checkout - Creer une session Checkout pour paiement unique
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = processCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type, data, processReference, paymentMode } = parsed.data;
    let { isFromSubscription } = parsed.data;
    const { isFreeProfile, partner, pricingCode, source } = parsed.data;

    // Recalculer le timbre fiscal cote serveur (ne jamais faire confiance au client)
    let stampTaxCents = 0;
    if (type === 'IDENTITY_CARD' && data.motif) {
      stampTaxCents = calculateStampTax(
        data.motif as string,
        (data.deliveryAddress as { zipCode?: string })?.zipCode
      );
    }

    // Verifier le type
    const processConfig = PROCESS_TYPES_CONFIG[type as ProcessType];
    if (!processConfig) {
      return NextResponse.json({ error: 'Type de demarche invalide' }, { status: 400 });
    }

    // Verification serveur : isFromSubscription doit correspondre a un abonnement actif reel
    if (isFromSubscription) {
      const eligibility = await checkProcessEligibility(session.user.id, type as ProcessType);
      if (!eligibility.eligible) {
        isFromSubscription = false;
      }
    }

    // Recuperer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    let newProcess;
    let reference = processReference;

    // Si une reference est fournie, recuperer la demarche existante
    if (processReference) {
      newProcess = await prisma.process.findFirst({
        where: {
          reference: processReference,
          userId: session.user.id,
          status: { in: ['DRAFT', 'PENDING_DOCUMENTS', 'PENDING_PAYMENT'] },
        },
      });

      if (!newProcess) {
        return NextResponse.json(
          { error: 'Demarche non trouvee ou deja traitee' },
          { status: 404 }
        );
      }
    } else {
      // Generer une nouvelle reference
      const count = await prisma.process.count();
      reference = generateReference('DEM', count + 1);
    }

    // Calculer le montant
    let amountCents = processConfig.basePrice;
    let taxesCents = 0;
    let serviceFeesCents = processConfig.basePrice;
    const lineItems: CheckoutLineItem[] = [];

    const psp = getDefaultPSPAdapter();

    // Pour la carte grise, calculer les taxes
    if (type === 'REGISTRATION_CERT' && data.vehicle && data.holder) {
      const vehicleData = data.vehicle as {
        fiscalPower: number;
        co2?: number;
        energyId: number;
        state: number;
        registrationNumber: string;
        registrationDate: string;
        make: string;
        model: string;
        typeId: number;
      };
      const holderData = data.holder as { departmentCode: string };

      const taxes = calculateRegistrationTaxes(
        { vehicle: vehicleData, departmentCode: holderData.departmentCode },
        processConfig.basePrice
      );

      taxesCents = taxes.taxeRegionale + taxes.taxeGestion + taxes.taxeAcheminement + taxes.malus;
      serviceFeesCents = taxes.serviceFee;
      amountCents = taxes.total;

      // Creer les lignes detaillees
      if (taxes.taxeRegionale > 0) {
        lineItems.push({
          priceData: { currency: 'eur', unitAmountCents: taxes.taxeRegionale, productName: 'Taxe regionale', productDescription: 'Taxe reversee a la region' },
          quantity: 1,
        });
      }

      lineItems.push({
        priceData: { currency: 'eur', unitAmountCents: taxes.taxeGestion, productName: 'Taxe de gestion', productDescription: 'Frais de gestion' },
        quantity: 1,
      });

      lineItems.push({
        priceData: { currency: 'eur', unitAmountCents: taxes.taxeAcheminement, productName: 'Redevance d\'acheminement', productDescription: 'Frais d\'envoi du certificat' },
        quantity: 1,
      });

      if (taxes.malus > 0) {
        lineItems.push({
          priceData: { currency: 'eur', unitAmountCents: taxes.malus, productName: 'Malus ecologique', productDescription: 'Taxe sur les emissions CO2' },
          quantity: 1,
        });
      }

      lineItems.push({
        priceData: { currency: 'eur', unitAmountCents: taxes.serviceFee, productName: 'Frais de service', productDescription: 'Traitement de votre demande' },
        quantity: 1,
      });
    } else {
      // Ajouter le timbre fiscal si applicable (CNI vol/perte)
      if (stampTaxCents > 0) {
        taxesCents += stampTaxCents;
        amountCents += stampTaxCents;
      }

      // Si abonne ou profil gratuit, seul le timbre fiscal est a payer (frais de service inclus)
      if (isFromSubscription || isFreeProfile) {
        serviceFeesCents = 0;
        amountCents = stampTaxCents; // Seulement le timbre

        if (stampTaxCents > 0) {
          lineItems.push({
            priceData: { currency: 'eur', unitAmountCents: stampTaxCents, productName: 'Timbre fiscal', productDescription: 'Obligatoire pour les demandes suite a un vol ou une perte' },
            quantity: 1,
          });
        }
      } else {
        // Non-abonne : ligne frais de service + timbre fiscal
        lineItems.push({
          priceData: { currency: 'eur', unitAmountCents: processConfig.basePrice, productName: processConfig.label, productDescription: `Demarche ${reference}` },
          quantity: 1,
        });

        if (stampTaxCents > 0) {
          lineItems.push({
            priceData: { currency: 'eur', unitAmountCents: stampTaxCents, productName: 'Timbre fiscal', productDescription: 'Obligatoire pour les demandes suite a un vol ou une perte' },
            quantity: 1,
          });
        }
      }
    }

    // Si pas de demarche existante, en creer une
    if (!newProcess) {
      const requiredDocs = getRequiredDocuments(type as ProcessType, data as Record<string, unknown>);
      const mandatoryFileTypes = requiredDocs.filter(d => d.required).map(d => d.id);

      newProcess = await prisma.process.create({
        data: {
          reference,
          userId: session.user.id,
          type: type as ProcessType,
          status: 'PENDING_PAYMENT',
          amountCents,
          taxesCents,
          serviceFeesCents,
          isFromSubscription: isFromSubscription || isFreeProfile,
          pspProvider: psp.provider,
          data,
          mandatoryFileTypes,
          partner,
          pricingCode,
          source,
        },
      });

      // Historique
      await prisma.processStatusHistory.create({
        data: {
          processId: newProcess.id,
          fromStatus: 'DRAFT',
          toStatus: 'PENDING_PAYMENT',
          reason: 'Creation de la demarche avec paiement',
          createdBy: session.user.id,
        },
      });
    } else {
      // Mettre a jour la demarche existante
      await prisma.process.update({
        where: { id: newProcess.id },
        data: {
          status: 'PENDING_PAYMENT',
          amountCents,
          taxesCents,
          serviceFeesCents,
          data,
        },
      });

      if (newProcess.status !== 'PENDING_PAYMENT') {
        await prisma.processStatusHistory.create({
          data: {
            processId: newProcess.id,
            fromStatus: newProcess.status,
            toStatus: 'PENDING_PAYMENT',
            reason: 'Passage au paiement',
            createdBy: session.user.id,
          },
        });
      }
    }

    // Si rien a payer (profil gratuit sans taxes), marquer directement comme paye
    if (amountCents === 0 && lineItems.length === 0) {
      await prisma.process.update({
        where: { id: newProcess.id },
        data: { status: 'PAID', paidAt: new Date() },
      });
      await prisma.processStatusHistory.create({
        data: {
          processId: newProcess.id,
          fromStatus: 'PENDING_PAYMENT',
          toStatus: 'PAID',
          reason: 'Profil gratuit - aucun paiement requis',
          createdBy: session.user.id,
        },
      });

      return NextResponse.json({
        processReference: reference,
        amount: 0,
        taxes: 0,
        serviceFee: 0,
        process: { reference },
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const typeSlug = getProcessTypeSlug(type as ProcessType);

    const sessionMetadata = {
      userId: user.id,
      processId: newProcess.id,
      processReference: reference,
      processType: type,
    };

    // Enregistrer le consentement CGV
    await recordConsent({
      userId: user.id,
      type: paymentMode === 'subscription' ? 'SUBSCRIPTION_CGV' : 'PROCESS_CGV',
      request,
      metadata: { processId: newProcess.id, processReference: reference },
    });

    let checkoutResult;

    if (paymentMode === 'subscription') {
      // Mode abonnement : prix recurrent + taxes en one-time si applicable
      const subscriptionPriceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;
      if (!subscriptionPriceId) {
        return NextResponse.json(
          { error: 'Configuration abonnement manquante' },
          { status: 500 }
        );
      }

      // Lignes pour le checkout subscription
      const subLineItems: CheckoutLineItem[] = [
        { priceId: subscriptionPriceId, quantity: 1 },
      ];

      // Si carte grise, ajouter les taxes en paiement unique
      if (type === 'REGISTRATION_CERT' && taxesCents > 0) {
        subLineItems.push({
          priceData: { currency: 'eur', unitAmountCents: taxesCents, productName: 'Taxes et redevances obligatoires', productDescription: 'Taxe regionale, gestion et acheminement' },
          quantity: 1,
        });
      }

      checkoutResult = await psp.createCheckoutSession({
        mode: 'subscription',
        customerEmail: user.email,
        lineItems: subLineItems,
        subscriptionMetadata: sessionMetadata,
        successUrl: `${baseUrl}/nouvelle-demarche/confirmation?ref=${reference}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/nouvelle-demarche/${typeSlug}?ref=${reference}&canceled=true`,
        metadata: sessionMetadata,
        locale: 'fr',
      });
    } else {
      // Mode paiement unique
      checkoutResult = await psp.createCheckoutSession({
        mode: 'payment',
        customerEmail: user.email,
        lineItems,
        successUrl: `${baseUrl}/nouvelle-demarche/confirmation?ref=${reference}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/nouvelle-demarche/${typeSlug}?ref=${reference}&canceled=true`,
        metadata: sessionMetadata,
        paymentIntentMetadata: { ...sessionMetadata, external_reference: reference! },
        locale: 'fr',
      });
    }

    // Stocker l'ID de session
    await prisma.process.update({
      where: { id: newProcess.id },
      data: {
        stripePaymentIntent: checkoutResult.sessionId,
      },
    });

    return NextResponse.json({
      sessionId: checkoutResult.sessionId,
      url: checkoutResult.url,
      processReference: reference,
      amount: amountCents,
      taxes: taxesCents,
      serviceFee: serviceFeesCents,
    });
  } catch (error) {
    console.error('Erreur creation session Checkout:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la session' },
      { status: 500 }
    );
  }
}
