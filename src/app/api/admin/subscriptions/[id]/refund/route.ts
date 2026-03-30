// API Admin - Remboursement echeances

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, logAdminAction } from '@/lib/admin-auth';
import { adminRefundDeadlinesSchema } from '@/schemas/admin';
import { getPSPAdapter } from '@/lib/psp';
import { createCreditNote } from '@/lib/invoice-creation';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
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

  const { deadlineIds, reason } = parsed.data;

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

  for (const deadline of eligibleDeadlines) {
    try {
      // 1. Marquer l'echeance comme remboursee en base AVANT l'appel PSP
      //    (si le PSP echoue, on rollback; si le PSP reussit mais la DB crashait apres, on aurait perdu la trace)
      await prisma.subscriptionDeadline.update({
        where: { id: deadline.id },
        data: {
          paymentStatus: 'REFUNDED',
          refundedAt: new Date(),
          refundedAmount: deadline.amountCents,
        },
      });

      // 2. Rembourser via PSP
      let pspRefundOk = false;
      if (deadline.pspInvoiceId) {
        try {
          let paymentId = deadline.pspInvoiceId;

          // Pour Stripe, resoudre l'invoice ID en payment_intent ID
          if (subscription.pspProvider === 'stripe' && paymentId.startsWith('in_')) {
            const Stripe = (await import('stripe')).default;
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });
            const stripeInvoice = await stripe.invoices.retrieve(paymentId);
            paymentId = stripeInvoice.payment_intent as string || paymentId;
          }

          await adapter.refund({
            paymentId,
            amountCents: deadline.amountCents,
            reason: reason || 'Admin refund',
          });
          pspRefundOk = true;
        } catch (pspErr) {
          // PSP echoue : rollback la DB
          console.error(`[Admin] Erreur PSP remboursement echeance ${deadline.id}:`, pspErr);
          await prisma.subscriptionDeadline.update({
            where: { id: deadline.id },
            data: { paymentStatus: 'PAID', refundedAt: null, refundedAmount: null },
          });
          results.push({ deadlineId: deadline.id, success: false, error: 'Erreur remboursement PSP' });
          continue;
        }
      } else {
        // Pas d'ID PSP (ex: paiement manuel) : on rembourse seulement en compta
        pspRefundOk = true;
      }

      // 3. Creer l'avoir
      const creditNote = await createCreditNote({
        userId: subscription.userId,
        totalCents: deadline.amountCents,
        reason: reason || `Remboursement echeance #${deadline.deadlineNumber}`,
      });

      results.push({ deadlineId: deadline.id, success: true, creditNoteId: creditNote.id });
    } catch (err) {
      console.error(`[Admin] Erreur remboursement echeance ${deadline.id}:`, err);
      results.push({ deadlineId: deadline.id, success: false, error: 'Erreur remboursement' });
    }
  }

  await logAdminAction(
    session.user.id,
    'refund_deadlines',
    'Subscription',
    id,
    { deadlineIds: eligibleDeadlines.map((d) => d.id), reason, results }
  );

  return NextResponse.json({ results });
}
