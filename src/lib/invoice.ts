// Service de generation de factures PDF

import PDFDocument from 'pdfkit';
import type { InvoiceWithRelations } from '@/types';
import { formatDate, formatCurrency } from './utils';
import { uploadToStorage } from './storage';

// Configuration entreprise (a personnaliser)
const COMPANY_INFO = {
  name: process.env.COMPANY_NAME || 'Ma Societe',
  address: process.env.COMPANY_ADDRESS || '123 Rue Example',
  zipCode: process.env.COMPANY_ZIPCODE || '75001',
  city: process.env.COMPANY_CITY || 'Paris',
  country: 'France',
  siret: process.env.COMPANY_SIRET || '123 456 789 00000',
  tva: process.env.COMPANY_TVA || 'FR12345678901',
  email: process.env.COMPANY_EMAIL || 'contact@example.com',
  phone: process.env.COMPANY_PHONE || '01 23 45 67 89',
};

// Generer le PDF d'une facture
export async function generateInvoicePdf(invoice: InvoiceWithRelations): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tete
      doc.fontSize(20).text('FACTURE', { align: 'center' });
      doc.moveDown();

      // Numero et date
      doc.fontSize(12);
      doc.text(`Facture N: ${invoice.number}`, { align: 'right' });
      doc.text(`Date: ${formatDate(invoice.createdAt)}`, { align: 'right' });
      if (invoice.paidAt) {
        doc.text(`Payee le: ${formatDate(invoice.paidAt)}`, { align: 'right' });
      }
      doc.moveDown();

      // Informations entreprise
      doc.text(COMPANY_INFO.name, 50, 150);
      doc.text(COMPANY_INFO.address);
      doc.text(`${COMPANY_INFO.zipCode} ${COMPANY_INFO.city}`);
      doc.text(COMPANY_INFO.country);
      doc.text(`SIRET: ${COMPANY_INFO.siret}`);
      doc.text(`TVA: ${COMPANY_INFO.tva}`);
      doc.moveDown();

      // Informations client
      if (invoice.user) {
        doc.text('Facture a:', 350, 150);
        doc.text(`${invoice.user.firstName} ${invoice.user.lastName}`);
        if (invoice.user.address) doc.text(invoice.user.address);
        if (invoice.user.zipCode && invoice.user.city) {
          doc.text(`${invoice.user.zipCode} ${invoice.user.city}`);
        }
        doc.text(invoice.user.email);
      }

      // Ligne de separation
      doc.moveTo(50, 280).lineTo(550, 280).stroke();

      // Description
      let description = '';
      if (invoice.type === 'SUBSCRIPTION') {
        description = `Abonnement mensuel${invoice.deadline ? ` - Echeance ${invoice.deadline.deadlineNumber}` : ''}`;
      } else if (invoice.type === 'PROCESS' && invoice.process) {
        description = `Demarche ${invoice.process.reference}`;
      } else if (invoice.type === 'CREDIT_NOTE') {
        description = 'Avoir';
      }

      // Tableau des lignes
      const tableTop = 300;
      doc.text('Description', 50, tableTop);
      doc.text('HT', 350, tableTop, { width: 70, align: 'right' });
      doc.text('TVA', 420, tableTop, { width: 50, align: 'right' });
      doc.text('TTC', 480, tableTop, { width: 70, align: 'right' });

      doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

      // Ligne facture
      doc.text(description, 50, tableTop + 30);
      doc.text(formatCurrency(invoice.subtotalCents), 350, tableTop + 30, { width: 70, align: 'right' });
      doc.text(`${invoice.taxRate}%`, 420, tableTop + 30, { width: 50, align: 'right' });
      doc.text(formatCurrency(invoice.totalCents), 480, tableTop + 30, { width: 70, align: 'right' });

      // Totaux
      doc.moveTo(350, tableTop + 60).lineTo(550, tableTop + 60).stroke();
      doc.text('Total HT:', 350, tableTop + 70);
      doc.text(formatCurrency(invoice.subtotalCents), 480, tableTop + 70, { width: 70, align: 'right' });
      doc.text(`TVA (${invoice.taxRate}%):`, 350, tableTop + 90);
      doc.text(formatCurrency(invoice.taxCents), 480, tableTop + 90, { width: 70, align: 'right' });
      doc.font('Helvetica-Bold');
      doc.text('Total TTC:', 350, tableTop + 115);
      doc.text(formatCurrency(invoice.totalCents), 480, tableTop + 115, { width: 70, align: 'right' });
      doc.font('Helvetica');

      // Statut paiement
      doc.moveDown(4);
      const statusText = invoice.status === 'PAID' ? 'PAYEE' : 'EN ATTENTE';
      doc.fontSize(14).text(`Statut: ${statusText}`, { align: 'center' });

      // Pied de page
      doc.fontSize(10);
      doc.text(
        `${COMPANY_INFO.name} - ${COMPANY_INFO.address}, ${COMPANY_INFO.zipCode} ${COMPANY_INFO.city}`,
        50,
        750,
        { align: 'center' }
      );
      doc.text(
        `Email: ${COMPANY_INFO.email} - Tel: ${COMPANY_INFO.phone}`,
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Generer et uploader une facture
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

// Generer le numero de facture
export async function generateInvoiceNumber(prisma: unknown): Promise<string> {
  const year = new Date().getFullYear();
  // @ts-expect-error - prisma type
  const count = await prisma.invoice.count({
    where: {
      number: {
        startsWith: `FAC-${year}`,
      },
    },
  });
  return `FAC-${year}-${String(count + 1).padStart(6, '0')}`;
}
