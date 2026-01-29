// API Route - Annulation abonnement

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getPSPAdapter } from '@/lib/psp';
import { sendEmail } from '@/lib/email';
import { formatDate } from '@/lib/utils';

// POST /api/subscriptions/cancel - Annuler l'abonnement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { reason, immediate = false } = body;

    // Recuperer l'abonnement
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Aucun abonnement trouve' },
        { status: 404 }
      );
    }

    if (subscription.status === 'CANCELED' || subscription.status === 'ENDED') {
      return NextResponse.json(
        { error: 'Abonnement deja annule' },
        { status: 400 }
      );
    }

    // Annuler via PSP
    if (subscription.pspSubscriptionId) {
      const psp = getPSPAdapter(subscription.pspProvider as 'stripe' | 'hipay');
      await psp.cancelSubscription(subscription.pspSubscriptionId, immediate);
    }

    // Mettre a jour en BDD
    const endDate = immediate ? new Date() : subscription.currentPeriodEnd;

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
        endDate,
      },
    });

    // Annuler les echeances futures
    await prisma.subscriptionDeadline.updateMany({
      where: {
        subscriptionId: subscription.id,
        status: 'UPCOMING',
      },
      data: {
        status: 'CANCELED',
      },
    });

    // Email de confirmation
    await sendEmail({
      to: subscription.user.email,
      subject: 'Confirmation d\'annulation de votre abonnement',
      template: 'subscription-canceled',
      data: {
        firstName: subscription.user.firstName,
        endDate: formatDate(endDate),
        reason,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Abonnement annule',
      endDate,
    });
  } catch (error) {
    console.error('Erreur annulation abonnement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation' },
      { status: 500 }
    );
  }
}
