// Génération PDF de courriers types (pdf-lib, compatible Vercel serverless)

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getTemplate } from './courrier-templates';

interface CourrierInput {
  templateId: string;
  senderName: string;
  senderAddress: string;
  senderZip: string;
  senderCity: string;
  data: Record<string, string>;
}

/**
 * Génère un PDF de courrier au format lettre A4.
 */
export async function generateCourrierPdf(input: CourrierInput): Promise<Buffer> {
  const template = getTemplate(input.templateId);
  if (!template) throw new Error(`Template inconnu : ${input.templateId}`);

  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();

  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const margin = 60;
  const maxWidth = 475;
  let y = height - 50;

  // --- Expéditeur (haut gauche) ---
  page.drawText(input.senderName, { x: margin, y, font: fontBold, size: 10, color: black });
  y -= 14;
  page.drawText(input.senderAddress, { x: margin, y, font, size: 9, color: gray });
  y -= 13;
  page.drawText(`${input.senderZip} ${input.senderCity}`, { x: margin, y, font, size: 9, color: gray });

  // --- Destinataire (haut droit) ---
  let dy = height - 120;
  const destName = input.data.destinataire || '';
  const destAddr = input.data.adresseDestinataire || '';
  if (destName) {
    page.drawText(destName, { x: 340, y: dy, font: fontBold, size: 10, color: black });
    dy -= 14;
  }
  for (const line of destAddr.split('\n')) {
    if (line.trim()) {
      page.drawText(line.trim(), { x: 340, y: dy, font, size: 9, color: gray });
      dy -= 13;
    }
  }

  // --- Lieu et date ---
  y = height - 200;
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  page.drawText(`${input.senderCity}, le ${today}`, { x: 340, y, font, size: 9, color: black });

  // --- Lettre recommandée ---
  if (template.recommande) {
    y -= 25;
    page.drawText('Lettre recommandée avec accusé de réception', { x: margin, y, font: fontBold, size: 9, color: black });
  }

  // --- Corps du courrier ---
  y -= 30;
  const body = replacePlaceholders(template.bodyTemplate, input.data);
  const lines = wrapText(body, font, 9, maxWidth);

  for (const line of lines) {
    if (y < 80) {
      // Nouvelle page si on déborde
      break;
    }
    if (line === '') {
      y -= 8;
    } else {
      page.drawText(line, { x: margin, y, font, size: 9, color: black });
      y -= 13;
    }
  }

  // --- Signature ---
  y -= 25;
  if (y > 80) {
    page.drawText(input.senderName, { x: 340, y, font: fontBold, size: 10, color: black });
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

function replacePlaceholders(text: string, data: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key === 'dateEffet' && data[key]) {
      return ` à compter du ${formatDateFr(data[key])}`;
    }
    if (key === 'dateEffet') return '';
    if (['dateDebut', 'dateFin', 'dateDepart', 'dateInfraction', 'dateChangement', 'dateEtatLieux'].includes(key) && data[key]) {
      return formatDateFr(data[key]);
    }
    return data[key] || '';
  });
}

function formatDateFr(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function wrapText(text: string, font: { widthOfTextAtSize: (text: string, size: number) => number }, fontSize: number, maxWidth: number): string[] {
  const result: string[] = [];
  const paragraphs = text.split('\n');

  for (const para of paragraphs) {
    if (para.trim() === '') {
      result.push('');
      continue;
    }
    const words = para.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const width = font.widthOfTextAtSize(test, fontSize);
      if (width > maxWidth && line) {
        result.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) result.push(line);
  }
  return result;
}
