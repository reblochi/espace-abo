// API Route - Changement de carte bancaire

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getPSPAdapter } from '@/lib/psp';

// GET /api/subscriptions/change-card - Obtenir URL pour changer CB
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['ACTIVE', 'PAST_DUE'] },
      },
    });

    if (!subscription || !subscription.pspCustomerId) {
      return NextResponse.json(
        { error: 'Abonnement non trouve' },
        { status: 404 }
      );
    }

    const psp = getPSPAdapter(subscription.pspProvider as 'stripe' | 'hipay');
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/espace-membre/mon-abonnement`;

    const result = await psp.updatePaymentMethod(subscription.pspCustomerId, returnUrl);

    return NextResponse.json({ url: result.redirectUrl });
  } catch (error) {
    console.error('Erreur changement CB:', error);
    return NextResponse.json(
      { error: 'Erreur lors du changement de carte' },
      { status: 500 }
    );
  }
}

// POST /api/subscriptions/change-card - Alternative via Checkout
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['ACTIVE', 'PAST_DUE'] },
      },
    });

    if (!subscription || !subscription.pspCustomerId) {
      return NextResponse.json(
        { error: 'Abonnement non trouve' },
        { status: 404 }
      );
    }

    const psp = getPSPAdapter(subscription.pspProvider as 'stripe' | 'hipay');
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/espace-membre/mon-abonnement?card_updated=true`;

    const result = await psp.updatePaymentMethod(subscription.pspCustomerId, returnUrl);

    return NextResponse.json({ url: result.redirectUrl });
  } catch (error) {
    console.error('Erreur changement CB:', error);
    return NextResponse.json(
      { error: 'Erreur lors du changement de carte' },
      { status: 500 }
    );
  }
}
