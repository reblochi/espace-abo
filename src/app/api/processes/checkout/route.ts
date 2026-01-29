// API Route - Creation session Stripe Checkout pour demarche unique

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { generateReference } from '@/lib/utils';
import { getProcessTypeConfig, type ProcessTypeCode } from '@/lib/process-types';
import Stripe from 'stripe';

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
    const { type, data } = body;

    // Verifier le type
    const processConfig = getProcessTypeConfig(type as ProcessTypeCode);
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

    // Generer une reference provisoire
    const count = await prisma.process.count();
    const reference = generateReference('DEM', count + 1);

    // Creer le process en statut PENDING_PAYMENT
    const newProcess = await prisma.process.create({
      data: {
        reference,
        userId: session.user.id,
        type: type,
        status: 'PENDING_PAYMENT',
        amountCents: processConfig.price,
        isFromSubscription: false,
        data: data,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Creer la session Checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: processConfig.label,
              description: `Demarche ${reference}`,
            },
            unit_amount: processConfig.price,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/nouvelle-demarche/confirmation?ref=${reference}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/nouvelle-demarche/${type.toLowerCase().replace(/_/g, '-')}?canceled=true`,
      metadata: {
        userId: user.id,
        processId: newProcess.id,
        processReference: reference,
      },
      locale: 'fr',
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      processReference: reference,
    });
  } catch (error) {
    console.error('Erreur creation session Checkout:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la session' },
      { status: 500 }
    );
  }
}
