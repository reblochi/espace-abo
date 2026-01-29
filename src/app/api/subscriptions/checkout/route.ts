// API Route - Creation session Stripe Checkout pour abonnement

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// POST /api/subscriptions/checkout - Creer une session Checkout
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json();
    const { priceId } = body;

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID requis' }, { status: 400 });
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

    // Creer ou recuperer le customer Stripe
    let customerId = existingSubscription?.pspCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Creer la session Checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/abonnement/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/abonnement?canceled=true`,
      metadata: {
        userId: user.id,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      billing_address_collection: 'auto',
      locale: 'fr',
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Erreur creation session Checkout:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la session' },
      { status: 500 }
    );
  }
}
