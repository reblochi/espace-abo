// Helper partage pour la creation de factures et avoirs

import { prisma } from '@/lib/db';
import { generateInvoiceNumber, generateCreditNoteNumber, generateAndUploadInvoice } from '@/lib/invoice';
import { Prisma } from '@prisma/client';

const TAX_RATE = 20.0; // TVA 20%
const MAX_RETRIES = 3;

interface CreateInvoiceOptions {
  userId: string;
  type: 'SUBSCRIPTION' | 'PROCESS';
  totalCents: number;
  paidAt?: Date;
  processId?: string;
  deadlineId?: string;
}

/**
 * Cree un record Invoice en base avec retry sur conflit de numero.
 * Genere le PDF et l'uploade sur R2 (non-bloquant).
 */
export async function createInvoiceRecord(options: CreateInvoiceOptions) {
  const { userId, type, totalCents, paidAt, processId, deadlineId } = options;

  const subtotalCents = Math.round(totalCents / (1 + TAX_RATE / 100));
  const taxCents = totalCents - subtotalCents;

  // Retry sur unique constraint violation (race condition numeros)
  let invoice;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const number = await generateInvoiceNumber(prisma);
    try {
      invoice = await prisma.invoice.create({
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
      break;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' && attempt < MAX_RETRIES - 1) {
        console.warn(`[Invoice] Conflit numero ${number}, retry ${attempt + 1}/${MAX_RETRIES}`);
        continue;
      }
      throw err;
    }
  }

  if (!invoice) throw new Error('Impossible de generer un numero de facture unique');

  // Generation PDF non-bloquante
  try {
    const pdfUrl = await generateAndUploadInvoice(invoice);
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl },
    });
  } catch (err) {
    console.error(`[Invoice] Erreur generation PDF pour ${invoice.number}:`, err);
  }

  return invoice;
}

interface CreateCreditNoteOptions {
  userId: string;
  totalCents: number;
  reason: string;
}

/**
 * Cree un avoir (facture negative / credit note).
 * Les montants sont stockes en negatif. Retry sur conflit de numero.
 */
export async function createCreditNote(options: CreateCreditNoteOptions) {
  const { userId, totalCents } = options;

  const absTotal = Math.abs(totalCents);
  const absSubtotal = Math.round(absTotal / (1 + TAX_RATE / 100));
  const absTax = absTotal - absSubtotal;

  let creditNote;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const number = await generateCreditNoteNumber(prisma);
    try {
      creditNote = await prisma.invoice.create({
        data: {
          number,
          userId,
          type: 'CREDIT_NOTE',
          subtotalCents: -absSubtotal,
          taxCents: -absTax,
          totalCents: -absTotal,
          taxRate: TAX_RATE,
          status: 'PAID',
          paidAt: new Date(),
        },
        include: {
          user: true,
          process: true,
          deadline: true,
        },
      });
      break;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' && attempt < MAX_RETRIES - 1) {
        console.warn(`[CreditNote] Conflit numero ${number}, retry ${attempt + 1}/${MAX_RETRIES}`);
        continue;
      }
      throw err;
    }
  }

  if (!creditNote) throw new Error('Impossible de generer un numero d\'avoir unique');

  try {
    const pdfUrl = await generateAndUploadInvoice(creditNote);
    await prisma.invoice.update({
      where: { id: creditNote.id },
      data: { pdfUrl },
    });
  } catch (err) {
    console.error(`[CreditNote] Erreur generation PDF pour ${creditNote.number}:`, err);
  }

  return creditNote;
}
