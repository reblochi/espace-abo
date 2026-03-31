// API Admin - Annulation abonnement

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent, logAdminAction } from '@/lib/admin-auth';
import { adminCancelSubscriptionSchema } from '@/schemas/admin';
import { getPSPAdapter } from '@/lib/psp';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const { id } = await params;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Body invalide' }, { status: 400 }); }
  const parsed = adminCancelSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Donnees invalides', details: parsed.error.flatten() }, { status: 400 });
  }

  const { reason, immediate } = parsed.data;

  const subscription = await prisma.subscription.findUnique({
    where: { id },
  });

  if (!subscription) {
    return NextResponse.json({ error: 'Abonnement non trouve' }, { status: 404 });
  }

  if (['CANCELED', 'ENDED'].includes(subscription.status)) {
    return NextResponse.json({ error: 'Abonnement deja annule' }, { status: 400 });
  }

  // Annuler cote PSP (skip si ID de test/fake)
  const isFakeId = subscription.pspSubscriptionId?.includes('fake');
  if (subscription.pspSubscriptionId && !isFakeId) {
    try {
      const adapter = getPSPAdapter(subscription.pspProvider as 'stripe' | 'hipay');
      await adapter.cancelSubscription(subscription.pspSubscriptionId, immediate);
    } catch (err) {
      console.error('[Admin] Erreur annulation PSP:', err);
      return NextResponse.json({ error: 'Erreur annulation PSP' }, { status: 500 });
    }
  }

  // Mettre a jour en base
  const now = new Date();
  const endDate = immediate ? now : subscription.currentPeriodEnd;

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id },
      data: {
        status: 'CANCELED',
        canceledAt: now,
        endDate,
      },
    }),
    // Annuler les echeances futures
    prisma.subscriptionDeadline.updateMany({
      where: { subscriptionId: id, status: 'UPCOMING' },
      data: { status: 'CANCELED' },
    }),
  ]);

  await logAdminAction(
    session.user.id,
    'cancel_subscription',
    'Subscription',
    id,
    { reason, immediate, performedBy: session.user.email }
  );

  return NextResponse.json({ success: true, endDate });
}
