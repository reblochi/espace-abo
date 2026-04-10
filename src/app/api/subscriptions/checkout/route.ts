// API Route - Creation session Checkout pour abonnement

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { recordConsent } from '@/lib/consent';
import { subscriptionCheckoutSchema } from '@/schemas/process';
import { getDefaultPSPAdapter } from '@/lib/psp';

// POST /api/subscriptions/checkout - Creer une session Checkout
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = subscriptionCheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { priceId } = parsed.data;

    // Verifier que le priceId correspond au prix attendu (pas de prix arbitraire)
    const expectedPriceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;
    if (!expectedPriceId || priceId !== expectedPriceId) {
      return NextResponse.json({ error: 'Prix invalide' }, { status: 400 });
    }

    // Verifier si deja abonne
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (existingSubscription?.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Abonnement deja actif' },
        { status: 400 }
      );
    }

    // Recuperer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    const psp = getDefaultPSPAdapter();

    // Creer ou recuperer le customer PSP
    let customerId = existingSubscription?.pspCustomerId;

    if (!customerId) {
      const customer = await psp.createCustomer(user.email, { userId: user.id });
      customerId = customer.customerId;
    }

    // Enregistrer le consentement CGV
    const consent = await recordConsent({
      userId: user.id,
      type: 'SUBSCRIPTION_CGV',
      request,
      metadata: { priceId },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Creer la session Checkout via l'adapter PSP
    const checkoutResult = await psp.createCheckoutSession({
      mode: 'subscription',
      customerId,
      lineItems: [{ priceId, quantity: 1 }],
      successUrl: `${baseUrl}/abonnement/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/abonnement?canceled=true`,
      metadata: { userId: user.id, consentId: consent.id },
      subscriptionMetadata: { userId: user.id },
      locale: 'fr',
      providerOptions: {
        customer_update: { address: 'auto', name: 'auto' },
        billing_address_collection: 'auto',
      },
    });

    return NextResponse.json({
      sessionId: checkoutResult.sessionId,
      url: checkoutResult.url,
    });
  } catch (error) {
    console.error('Erreur creation session Checkout:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la session' },
      { status: 500 }
    );
  }
}
