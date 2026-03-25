// API Route - Creation session Stripe Checkout pour demarche unique

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { generateReference } from '@/lib/utils';
import {
  PROCESS_TYPES_CONFIG,
  getProcessTypeSlug,
  getRequiredDocuments,
} from '@/lib/process-types';
import { calculateRegistrationTaxes } from '@/lib/taxes/registration-certificate';
import Stripe from 'stripe';
import type { ProcessType } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// POST /api/processes/checkout - Creer une session Checkout pour paiement unique
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data, processReference, paymentMode = 'one_time', stampTaxCents = 0, isFromSubscription = false } = body;

    // Verifier le type
    const processConfig = PROCESS_TYPES_CONFIG[type as ProcessType];
    if (!processConfig) {
      return NextResponse.json({ error: 'Type de demarche invalide' }, { status: 400 });
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
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

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
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Taxe regionale',
              description: 'Taxe reversee a la region',
            },
            unit_amount: taxes.taxeRegionale,
          },
          quantity: 1,
        });
      }

      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Taxe de gestion',
            description: 'Frais de gestion',
          },
          unit_amount: taxes.taxeGestion,
        },
        quantity: 1,
      });

      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Redevance d\'acheminement',
            description: 'Frais d\'envoi du certificat',
          },
          unit_amount: taxes.taxeAcheminement,
        },
        quantity: 1,
      });

      if (taxes.malus > 0) {
        lineItems.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Malus ecologique',
              description: 'Taxe sur les emissions CO2',
            },
            unit_amount: taxes.malus,
          },
          quantity: 1,
        });
      }

      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Frais de service',
            description: 'Traitement de votre demande',
          },
          unit_amount: taxes.serviceFee,
        },
        quantity: 1,
      });
    } else {
      // Ajouter le timbre fiscal si applicable (CNI vol/perte)
      if (stampTaxCents > 0) {
        taxesCents += stampTaxCents;
        amountCents += stampTaxCents;
      }

      // Si abonne, seul le timbre fiscal est a payer (frais de service inclus)
      if (isFromSubscription) {
        serviceFeesCents = 0;
        amountCents = stampTaxCents; // Seulement le timbre

        if (stampTaxCents > 0) {
          lineItems.push({
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Timbre fiscal',
                description: 'Obligatoire pour les demandes suite a un vol ou une perte',
              },
              unit_amount: stampTaxCents,
            },
            quantity: 1,
          });
        }
      } else {
        // Non-abonne : ligne frais de service + timbre fiscal
        lineItems.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: processConfig.label,
              description: `Demarche ${reference}`,
            },
            unit_amount: processConfig.basePrice,
          },
          quantity: 1,
        });

        if (stampTaxCents > 0) {
          lineItems.push({
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Timbre fiscal',
                description: 'Obligatoire pour les demandes suite a un vol ou une perte',
              },
              unit_amount: stampTaxCents,
            },
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
          isFromSubscription,
          data,
          mandatoryFileTypes,
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

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const typeSlug = getProcessTypeSlug(type as ProcessType);

    const sessionMetadata = {
      userId: user.id,
      processId: newProcess.id,
      processReference: reference,
      processType: type,
    };

    let checkoutSession: Stripe.Checkout.Session;

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
      const subLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        { price: subscriptionPriceId, quantity: 1 },
      ];

      // Si carte grise, ajouter les taxes en paiement unique
      if (type === 'REGISTRATION_CERT' && taxesCents > 0) {
        // Regrouper toutes les taxes en une seule ligne one-time
        subLineItems.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Taxes et redevances obligatoires',
              description: 'Taxe regionale, gestion et acheminement',
            },
            unit_amount: taxesCents,
          },
          quantity: 1,
        });
      }

      checkoutSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: user.email,
        line_items: subLineItems,
        subscription_data: {
          metadata: sessionMetadata,
        },
        success_url: `${baseUrl}/nouvelle-demarche/confirmation?ref=${reference}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/nouvelle-demarche/${typeSlug}?ref=${reference}&canceled=true`,
        metadata: sessionMetadata,
        locale: 'fr',
      });
    } else {
      // Mode paiement unique (comportement existant)
      checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: user.email,
        line_items: lineItems,
        success_url: `${baseUrl}/nouvelle-demarche/confirmation?ref=${reference}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/nouvelle-demarche/${typeSlug}?ref=${reference}&canceled=true`,
        metadata: sessionMetadata,
        payment_intent_data: {
          metadata: {
            ...sessionMetadata,
            external_reference: reference,
          },
        },
        locale: 'fr',
      });
    }

    // Stocker l'ID de session Stripe
    await prisma.process.update({
      where: { id: newProcess.id },
      data: {
        stripePaymentIntent: checkoutSession.id,
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      processReference: reference,
      amount: amountCents,
      taxes: taxesCents,
      serviceFee: serviceFeesCents,
    });
  } catch (error) {
    console.error('Erreur creation session Checkout:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la session', details: message },
      { status: 500 }
    );
  }
}
