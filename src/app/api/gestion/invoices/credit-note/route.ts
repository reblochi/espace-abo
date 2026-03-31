// API Admin - Creation d'un avoir

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent, logAdminAction } from '@/lib/admin-auth';
import { adminCreateCreditNoteSchema } from '@/schemas/admin';
import { createCreditNote } from '@/lib/invoice-creation';

export async function POST(request: NextRequest) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Body invalide' }, { status: 400 }); }
  const parsed = adminCreateCreditNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Donnees invalides', details: parsed.error.flatten() }, { status: 400 });
  }

  const { invoiceId, amountCents, reason } = parsed.data;

  // Recuperer la facture d'origine
  const originalInvoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!originalInvoice) {
    return NextResponse.json({ error: 'Facture non trouvee' }, { status: 404 });
  }

  if (originalInvoice.type === 'CREDIT_NOTE') {
    return NextResponse.json({ error: 'Impossible de creer un avoir sur un avoir' }, { status: 400 });
  }

  // Verifier le montant total deja rembourse via avoirs (stocke dans audit logs)
  const existingCreditNotes = await prisma.adminAuditLog.findMany({
    where: {
      action: 'create_credit_note',
      metadata: { path: ['originalInvoiceId'], equals: invoiceId },
    },
    select: { metadata: true },
  });
  const alreadyRefunded = existingCreditNotes.reduce((sum: number, log: { metadata: unknown }) => {
    const meta = log.metadata as Record<string, unknown> | null;
    return sum + ((meta?.amountCents as number) || 0);
  }, 0);

  // Montant de l'avoir (partiel ou total)
  const creditAmount = amountCents || originalInvoice.totalCents;
  const remaining = originalInvoice.totalCents - alreadyRefunded;

  if (creditAmount > remaining) {
    return NextResponse.json({
      error: remaining <= 0
        ? 'Cette facture a deja ete integralement remboursee'
        : `Montant max remboursable : ${(remaining / 100).toFixed(2)} EUR (deja rembourse : ${(alreadyRefunded / 100).toFixed(2)} EUR)`,
    }, { status: 400 });
  }

  const creditNote = await createCreditNote({
    userId: originalInvoice.userId,
    totalCents: creditAmount,
    reason,
  });

  await logAdminAction(
    session.user.id,
    'create_credit_note',
    'Invoice',
    creditNote.id,
    { originalInvoiceId: invoiceId, amountCents: creditAmount, reason }
  );

  return NextResponse.json(creditNote, { status: 201 });
}
