// API Route - Verifier statut abonnement

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET /api/subscriptions/check - Verifier si l'utilisateur a un abonnement actif
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        isActive: false,
      });
    }

    // Un abonnement est actif s'il est ACTIVE ou CANCELED mais avec des droits restants
    const isActive =
      subscription.status === 'ACTIVE' ||
      (subscription.status === 'CANCELED' &&
        subscription.endDate &&
        subscription.endDate > new Date());

    return NextResponse.json({
      hasSubscription: true,
      isActive,
      subscription: {
        id: subscription.id,
        reference: subscription.reference,
        status: subscription.status,
        endDate: subscription.endDate,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    });
  } catch (error) {
    console.error('Erreur verification abonnement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la verification' },
      { status: 500 }
    );
  }
}
