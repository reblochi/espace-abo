// API Checkout - Cree une session Stripe a partir d'une reference de demarche
// Pas d'authentification requise (utilise par les formulaires embed)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { PROCESS_TYPES_CONFIG } from '@/lib/process-types';
import Stripe from 'stripe';
import type { ProcessType } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

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

    let checkoutSession: Stripe.Checkout.Session;

    if (mode === 'subscription') {
      // Mode abonnement
      const subscriptionPriceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;
      if (!subscriptionPriceId) {
        return NextResponse.json({ error: 'Configuration abonnement manquante' }, { status: 500 });
      }

      checkoutSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: processRecord.user.email,
        line_items: [{ price: subscriptionPriceId, quantity: 1 }],
        subscription_data: { metadata: sessionMetadata },
        success_url: `${baseUrl}/confirmation?ref=${processRecord.reference}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/checkout?ref=${processRecord.reference}&mode=${mode}&partner=${partner || ''}`,
        metadata: sessionMetadata,
        locale: 'fr',
      });
    } else {
      // Mode paiement unique
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

      // Frais de service
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: processConfig.label,
            description: `Demarche ${processRecord.reference}`,
          },
          unit_amount: processConfig.basePrice,
        },
        quantity: 1,
      });

      // Timbre fiscal si applicable
      const stampTax = processRecord.amountCents - processConfig.basePrice;
      if (stampTax > 0) {
        lineItems.push({
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Timbre fiscal',
              description: 'Obligatoire pour les demandes suite a un vol ou une perte',
            },
            unit_amount: stampTax,
          },
          quantity: 1,
        });
      }

      checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: processRecord.user.email,
        line_items: lineItems,
        success_url: `${baseUrl}/confirmation?ref=${processRecord.reference}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/checkout?ref=${processRecord.reference}&mode=${mode}&partner=${partner || ''}`,
        metadata: sessionMetadata,
        payment_intent_data: {
          metadata: {
            ...sessionMetadata,
            external_reference: processRecord.reference,
          },
        },
        locale: 'fr',
      });
    }

    // Stocker l'ID de session Stripe
    await prisma.process.update({
      where: { id: processRecord.id },
      data: { stripePaymentIntent: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Erreur checkout:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la creation du paiement' },
      { status: 500 }
    );
  }
}
