// Helper partage pour la creation de factures

import { prisma } from '@/lib/db';
import { generateInvoiceNumber, generateAndUploadInvoice } from '@/lib/invoice';

const TAX_RATE = 20.0; // TVA 20%

interface CreateInvoiceOptions {
  userId: string;
  type: 'SUBSCRIPTION' | 'PROCESS';
  totalCents: number;
  paidAt?: Date;
  processId?: string;
  deadlineId?: string;
}

/**
 * Cree un record Invoice en base, genere le PDF et l'uploade sur R2.
 * Les erreurs de generation PDF sont non-bloquantes.
 */
export async function createInvoiceRecord(options: CreateInvoiceOptions) {
  const { userId, type, totalCents, paidAt, processId, deadlineId } = options;

  // Calcul HT/TVA depuis le TTC
  const subtotalCents = Math.round(totalCents / (1 + TAX_RATE / 100));
  const taxCents = totalCents - subtotalCents;

  // Generer le numero de facture
  const number = await generateInvoiceNumber(prisma);

  // Creer le record en base
  const invoice = await prisma.invoice.create({
    data: {
      number,
      userId,
      type,
      subtotalCents,
      taxCents,
      totalCents,
      taxRate: TAX_RATE,
      status: 'PAID',
      paidAt: paidAt || new Date(),
      processId: processId || null,
      deadlineId: deadlineId || null,
    },
    include: {
      user: true,
      process: true,
      deadline: true,
    },
  });

  // Tenter la generation PDF + upload R2 (non-bloquant)
  try {
    const pdfUrl = await generateAndUploadInvoice(invoice);
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl },
    });
  } catch (err) {
    console.error(`[Invoice] Erreur generation PDF pour ${number}:`, err);
  }

  return invoice;
}
