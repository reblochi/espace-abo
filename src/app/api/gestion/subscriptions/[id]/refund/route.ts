// API Admin - Remboursement echeances

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent, logAdminAction } from '@/lib/admin-auth';
import { adminRefundDeadlinesSchema } from '@/schemas/admin';
import { getPSPAdapter } from '@/lib/psp';
import { createCreditNote } from '@/lib/invoice-creation';

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
  const parsed = adminRefundDeadlinesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Donnees invalides', details: parsed.error.flatten() }, { status: 400 });
  }

  const { deadlineIds, reason, cancelSubscription, customAmountCents } = parsed.data;

  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      deadlines: {
        where: { id: { in: deadlineIds } },
      },
    },
  });

  if (!subscription) {
    return NextResponse.json({ error: 'Abonnement non trouve' }, { status: 404 });
  }

  // Verifier que les echeances sont bien payees
  const eligibleDeadlines = subscription.deadlines.filter(
    (d) => d.paymentStatus === 'PAID'
  );

  if (eligibleDeadlines.length === 0) {
    return NextResponse.json({ error: 'Aucune echeance remboursable selectionnee' }, { status: 400 });
  }

  const adapter = getPSPAdapter(subscription.pspProvider as 'stripe' | 'hipay');
  const results: { deadlineId: string; success: boolean; creditNoteId?: string; error?: string }[] = [];

  // Calculer le montant total des échéances sélectionnées
  const totalEligibleCents = eligibleDeadlines.reduce((sum, d) => sum + d.amountCents, 0);

  // Valider le montant custom
  if (customAmountCents && customAmountCents > totalEligibleCents) {
    return NextResponse.json(
      { error: `Montant (${(customAmountCents / 100).toFixed(2)} €) dépasse le total remboursable (${(totalEligibleCents / 100).toFixed(2)} €)` },
      { status: 400 }
    );
  }
  const refundAmountCents = customAmountCents || totalEligibleCents;

  if (refundAmountCents <= 0) {
    return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
  }

  // Répartir le montant sur les échéances (ou tout sur la première si montant custom)
  let remainingCents = refundAmountCents;

  for (const deadline of eligibleDeadlines) {
    if (remainingCents <= 0) break;

    const amountForThis = Math.min(remainingCents, deadline.amountCents);
    remainingCents -= amountForThis;

    try {
      // 1. Marquer l'échéance comme remboursée
      await prisma.subscriptionDeadline.update({
        where: { id: deadline.id },
        data: {
          paymentStatus: 'REFUNDED',
          refundedAt: new Date(),
          refundedAmount: amountForThis,
        },
      });

      // 2. Rembourser via PSP (skip si ID de test/fake)
      const isFakeId = deadline.pspInvoiceId?.includes('fake');
      if (deadline.pspInvoiceId && !isFakeId) {
        try {
          await adapter.refund({
            paymentId: deadline.pspInvoiceId,
            amountCents: amountForThis,
            reason: reason || 'requested_by_customer',
          });
        } catch (pspErr) {
          console.error(`[Admin] Erreur PSP remboursement échéance ${deadline.id}:`, pspErr);
          await prisma.subscriptionDeadline.update({
            where: { id: deadline.id },
            data: { paymentStatus: 'PAID', refundedAt: null, refundedAmount: null },
          });
          results.push({ deadlineId: deadline.id, success: false, error: 'Erreur remboursement PSP' });
          continue;
        }
      }

      // 3. Créer l'avoir
      const creditNote = await createCreditNote({
        userId: subscription.userId,
        totalCents: amountForThis,
        reason: reason || `Remboursement échéance #${deadline.deadlineNumber}${amountForThis < deadline.amountCents ? ' (partiel)' : ''}`,
      });

      results.push({ deadlineId: deadline.id, success: true, creditNoteId: creditNote.id });
    } catch (err) {
      console.error(`[Admin] Erreur remboursement échéance ${deadline.id}:`, err);
      results.push({ deadlineId: deadline.id, success: false, error: 'Erreur remboursement' });
    }
  }

  // Desabonner si demande
  let canceled = false;
  if (cancelSubscription && ['ACTIVE', 'PAST_DUE', 'PENDING'].includes(subscription.status)) {
    if (subscription.pspSubscriptionId) {
      try {
        await adapter.cancelSubscription(subscription.pspSubscriptionId, true);
      } catch (err) {
        console.error('[Admin] Erreur annulation PSP apres remboursement:', err);
      }
    }
    await prisma.$transaction([
      prisma.subscription.update({
        where: { id },
        data: { status: 'CANCELED', canceledAt: new Date(), endDate: new Date() },
      }),
      prisma.subscriptionDeadline.updateMany({
        where: { subscriptionId: id, status: 'UPCOMING' },
        data: { status: 'CANCELED' },
      }),
    ]);
    canceled = true;
  }

  await logAdminAction(
    session.user.id,
    cancelSubscription ? 'refund_and_cancel' : 'refund_deadlines',
    'Subscription',
    id,
    {
      deadlineIds: eligibleDeadlines.map((d) => d.id),
      reason,
      results,
      canceled,
      performedBy: session.user.email,
    }
  );

  return NextResponse.json({ results, canceled });
}
