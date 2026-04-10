// API Checkout - Cree une session de paiement a partir d'une reference de demarche
// Pas d'authentification requise (utilise par les formulaires embed)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PROCESS_TYPES_CONFIG } from '@/lib/process-types';
import { getDefaultPSPAdapter } from '@/lib/psp';
import type { CheckoutLineItem } from '@/lib/psp/types';
import type { ProcessType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { ref, mode = 'one_time', partner } = await request.json();

    if (!ref) {
      return NextResponse.json({ error: 'Reference requise' }, { status: 400 });
    }

    // Recuperer la demarche
    const processRecord = await prisma.process.findUnique({
      where: { reference: ref },
      include: { user: true },
    });

    if (!processRecord) {
      return NextResponse.json({ error: 'Demarche non trouvee' }, { status: 404 });
    }

    if (processRecord.status !== 'PENDING_PAYMENT') {
      return NextResponse.json(
        { error: 'Cette demarche n\'est plus en attente de paiement' },
        { status: 400 }
      );
    }

    const processConfig = PROCESS_TYPES_CONFIG[processRecord.type as ProcessType];
    if (!processConfig) {
      return NextResponse.json({ error: 'Type de demarche invalide' }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;

    const sessionMetadata = {
      userId: processRecord.userId,
      processId: processRecord.id,
      processReference: processRecord.reference,
      processType: processRecord.type,
      partner: partner || '',
      gclid: processRecord.gclid || '',
    };

    const psp = getDefaultPSPAdapter();
    let checkoutResult;

    if (mode === 'subscription') {
      // Mode abonnement
      const subscriptionPriceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;
      if (!subscriptionPriceId) {
        return NextResponse.json({ error: 'Configuration abonnement manquante' }, { status: 500 });
      }

      checkoutResult = await psp.createCheckoutSession({
        mode: 'subscription',
        customerEmail: processRecord.user.email,
        lineItems: [{ priceId: subscriptionPriceId, quantity: 1 }],
        subscriptionMetadata: sessionMetadata,
        successUrl: `${baseUrl}/confirmation?ref=${processRecord.reference}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/checkout?ref=${processRecord.reference}&mode=${mode}&partner=${partner || ''}`,
        metadata: sessionMetadata,
        locale: 'fr',
      });
    } else {
      // Mode paiement unique
      const lineItems: CheckoutLineItem[] = [];

      // Frais de service
      lineItems.push({
        priceData: { currency: 'eur', unitAmountCents: processConfig.basePrice, productName: processConfig.label, productDescription: `Demarche ${processRecord.reference}` },
        quantity: 1,
      });

      // Timbre fiscal si applicable
      const stampTax = processRecord.amountCents - processConfig.basePrice;
      if (stampTax > 0) {
        lineItems.push({
          priceData: { currency: 'eur', unitAmountCents: stampTax, productName: 'Timbre fiscal', productDescription: 'Obligatoire pour les demandes suite a un vol ou une perte' },
          quantity: 1,
        });
      }

      checkoutResult = await psp.createCheckoutSession({
        mode: 'payment',
        customerEmail: processRecord.user.email,
        lineItems,
        successUrl: `${baseUrl}/confirmation?ref=${processRecord.reference}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/checkout?ref=${processRecord.reference}&mode=${mode}&partner=${partner || ''}`,
        metadata: sessionMetadata,
        paymentIntentMetadata: { ...sessionMetadata, external_reference: processRecord.reference },
        locale: 'fr',
      });
    }

    // Stocker l'ID de session
    await prisma.process.update({
      where: { id: processRecord.id },
      data: { stripePaymentIntent: checkoutResult.sessionId },
    });

    return NextResponse.json({ url: checkoutResult.url });
  } catch (error) {
    console.error('Erreur checkout:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la creation du paiement' },
      { status: 500 }
    );
  }
}
