// Service de génération de factures PDF (pdf-lib, 100% mémoire, compatible Vercel serverless)

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { InvoiceWithRelations } from '@/types';
import { formatDate, formatCurrency } from './utils';
import { uploadToStorage } from './storage';

const COMPANY_INFO = {
  name: 'SAF Service B.V.',
  address: 'Herengracht 449A',
  zipCode: '1017 BR',
  city: 'Amsterdam',
  country: 'Pays-Bas',
  kvk: '94972788',
  tva: 'NL867888246B01',
  email: 'contact@franceguichet.fr',
  phone: '01 23 45 67 89',
};

export async function generateInvoicePdf(invoice: InvoiceWithRelations): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();

  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);

  let y = height - 50;

  // --- Titre ---
  const title = invoice.type === 'CREDIT_NOTE' ? 'AVOIR' : 'FACTURE';
  page.drawText(title, { x: 230, y, font: fontBold, size: 22, color: black });
  y -= 35;

  // --- Numéro et date (droite) ---
  const docLabel = invoice.type === 'CREDIT_NOTE' ? 'Avoir' : 'Facture';
  page.drawText(`${docLabel} N° : ${invoice.number}`, { x: 350, y, font, size: 10, color: black });
  y -= 15;
  page.drawText(`Date : ${formatDate(invoice.createdAt)}`, { x: 350, y, font, size: 10, color: black });
  if (invoice.paidAt) {
    y -= 15;
    page.drawText(`Payée le : ${formatDate(invoice.paidAt)}`, { x: 350, y, font, size: 10, color: black });
  }

  // --- Entreprise (gauche) ---
  let ey = height - 85;
  page.drawText(COMPANY_INFO.name, { x: 50, y: ey, font: fontBold, size: 11, color: black });
  ey -= 15;
  page.drawText(COMPANY_INFO.address, { x: 50, y: ey, font, size: 9, color: gray });
  ey -= 13;
  page.drawText(`${COMPANY_INFO.zipCode} ${COMPANY_INFO.city}, ${COMPANY_INFO.country}`, { x: 50, y: ey, font, size: 9, color: gray });
  ey -= 13;
  page.drawText(`KVK : ${COMPANY_INFO.kvk}`, { x: 50, y: ey, font, size: 9, color: gray });
  ey -= 13;
  page.drawText(`TVA : ${COMPANY_INFO.tva}`, { x: 50, y: ey, font, size: 9, color: gray });

  // --- Client (droite, sous les dates) ---
  if (invoice.user) {
    let cy = height - 145;
    page.drawText('Facturé à :', { x: 350, y: cy, font, size: 9, color: gray });
    cy -= 15;
    page.drawText(`${invoice.user.firstName} ${invoice.user.lastName}`, { x: 350, y: cy, font: fontBold, size: 10, color: black });
    if (invoice.user.address) {
      cy -= 13;
      page.drawText(invoice.user.address, { x: 350, y: cy, font, size: 9, color: gray });
    }
    if (invoice.user.zipCode && invoice.user.city) {
      cy -= 13;
      page.drawText(`${invoice.user.zipCode} ${invoice.user.city}`, { x: 350, y: cy, font, size: 9, color: gray });
    }
    cy -= 13;
    page.drawText(invoice.user.email, { x: 350, y: cy, font, size: 9, color: gray });
  }

  // --- Ligne de séparation ---
  y = height - 260;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.5, color: gray });

  // --- Description ---
  let description = '';
  if (invoice.type === 'SUBSCRIPTION') {
    description = `Abonnement mensuel${invoice.deadline ? ` - Échéance ${invoice.deadline.deadlineNumber}` : ''}`;
  } else if (invoice.type === 'PROCESS' && invoice.process) {
    description = `Démarche ${invoice.process.reference}`;
  } else if (invoice.type === 'CREDIT_NOTE') {
    description = 'Avoir';
  }

  // --- En-tête tableau ---
  y -= 20;
  page.drawText('Description', { x: 50, y, font: fontBold, size: 9, color: black });
  page.drawText('HT', { x: 350, y, font: fontBold, size: 9, color: black });
  page.drawText('TVA', { x: 420, y, font: fontBold, size: 9, color: black });
  page.drawText('TTC', { x: 490, y, font: fontBold, size: 9, color: black });

  y -= 5;
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.3, color: gray });

  // --- Ligne facture ---
  y -= 18;
  page.drawText(description, { x: 50, y, font, size: 9, color: black });
  page.drawText(formatCurrency(invoice.subtotalCents), { x: 340, y, font, size: 9, color: black });
  page.drawText(`${invoice.taxRate}%`, { x: 420, y, font, size: 9, color: black });
  page.drawText(formatCurrency(invoice.totalCents), { x: 480, y, font, size: 9, color: black });

  // --- Totaux ---
  y -= 30;
  page.drawLine({ start: { x: 330, y: y + 5 }, end: { x: 545, y: y + 5 }, thickness: 0.3, color: gray });
  page.drawText('Total HT :', { x: 340, y: y - 10, font, size: 9, color: black });
  page.drawText(formatCurrency(invoice.subtotalCents), { x: 480, y: y - 10, font, size: 9, color: black });
  page.drawText(`TVA (${invoice.taxRate}%) :`, { x: 340, y: y - 25, font, size: 9, color: black });
  page.drawText(formatCurrency(invoice.taxCents), { x: 480, y: y - 25, font, size: 9, color: black });

  y -= 45;
  page.drawLine({ start: { x: 330, y: y + 5 }, end: { x: 545, y: y + 5 }, thickness: 0.5, color: black });
  page.drawText('Total TTC :', { x: 340, y: y - 10, font: fontBold, size: 11, color: black });
  page.drawText(formatCurrency(invoice.totalCents), { x: 475, y: y - 10, font: fontBold, size: 11, color: black });

  // --- Statut ---
  y -= 50;
  const statusText = invoice.status === 'PAID' ? 'PAYÉE' : 'EN ATTENTE';
  page.drawText(`Statut : ${statusText}`, { x: 230, y, font: fontBold, size: 13, color: black });

  // --- Pied de page ---
  page.drawText(
    `${COMPANY_INFO.name} - ${COMPANY_INFO.address}, ${COMPANY_INFO.zipCode} ${COMPANY_INFO.city}, ${COMPANY_INFO.country} - KVK ${COMPANY_INFO.kvk}`,
    { x: 50, y: 50, font, size: 7, color: gray }
  );
  page.drawText(
    `Email : ${COMPANY_INFO.email} - Tél : ${COMPANY_INFO.phone}`,
    { x: 150, y: 38, font, size: 8, color: gray }
  );

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

// Générer et uploader une facture
export async function generateAndUploadInvoice(invoice: InvoiceWithRelations): Promise<string> {
  const pdfBuffer = await generateInvoicePdf(invoice);
  const { storageUrl } = await uploadToStorage(
    pdfBuffer,
    `facture-${invoice.number}.pdf`,
    'application/pdf',
    'invoices'
  );
  return storageUrl;
}

// Générer le prochain numéro séquentiel pour un préfixe donné.
async function generateNextNumber(prismaClient: unknown, prefix: string): Promise<string> {
  const year = new Date().getFullYear();
  const fullPrefix = `${prefix}-${year}-`;

  // @ts-expect-error - prisma type
  const last = await prismaClient.invoice.findFirst({
    where: { number: { startsWith: fullPrefix } },
    orderBy: { number: 'desc' },
    select: { number: true },
  });

  let nextNum = 1;
  if (last?.number) {
    const lastNumStr = last.number.replace(fullPrefix, '');
    const parsed = parseInt(lastNumStr, 10);
    if (!isNaN(parsed)) nextNum = parsed + 1;
  }

  return `${fullPrefix}${String(nextNum).padStart(6, '0')}`;
}

export async function generateInvoiceNumber(prismaClient: unknown): Promise<string> {
  return generateNextNumber(prismaClient, 'FAC');
}

export async function generateCreditNoteNumber(prismaClient: unknown): Promise<string> {
  return generateNextNumber(prismaClient, 'AVO');
}
