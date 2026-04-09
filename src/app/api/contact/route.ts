// API Route - Formulaire de contact public (sans auth)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail, sendRawEmail } from '@/lib/email';
import { contactSchema } from '@/schemas/contact';
import { ZodError } from 'zod';

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

async function storageUpload(buffer: Buffer, name: string, type: string, folder: string) {
  const { uploadToStorage } = await import('@/lib/storage');
  return uploadToStorage(buffer, name, type, folder);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extraire les champs texte
    const rawData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      processReference: (formData.get('processReference') as string) || undefined,
      message: formData.get('message') as string,
    };

    // Valider
    const data = contactSchema.parse(rawData);

    // Generer reference CTT-YYYY-XXXXXX
    const count = await prisma.contactSubmission.count();
    const year = new Date().getFullYear();
    const reference = `CTT-${year}-${String(count + 1).padStart(6, '0')}`;

    // Creer la soumission
    const submission = await prisma.contactSubmission.create({
      data: {
        reference,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        subject: data.subject,
        processReference: data.processReference || null,
        message: data.message,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      },
    });

    // Upload des fichiers
    const files = formData.getAll('files') as File[];
    const validFiles = files.filter(
      (f) => f instanceof File && f.size > 0 && f.size <= MAX_FILE_SIZE && ALLOWED_TYPES.includes(f.type)
    ).slice(0, MAX_FILES);

    for (const file of validFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const { fileName: fileKey } = await storageUpload(buffer, file.name, file.type, 'contacts');

      await prisma.contactFile.create({
        data: {
          contactId: submission.id,
          fileName: file.name,
          fileKey,
          fileSize: file.size,
          mimeType: file.type,
        },
      });
    }

    // Email confirmation au client
    try {
      await sendEmail({
        to: data.email,
        template: 'contact-confirmation',
        data: {
          firstName: data.firstName,
          reference,
        },
      });
    } catch {
      // Non-bloquant
    }

    // Email notification admin
    const adminEmail = process.env.ADMIN_CONTACT_EMAIL || 'contact@franceguichet.fr';
    try {
      await sendRawEmail(
        adminEmail,
        `[Contact ${reference}] ${data.subject}`,
        `<p><strong>De :</strong> ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)} (${escapeHtml(data.email)})</p>
         <p><strong>Sujet :</strong> ${data.subject}</p>
         ${data.processReference ? `<p><strong>Réf. démarche :</strong> ${escapeHtml(data.processReference)}</p>` : ''}
         <p><strong>Message :</strong></p>
         <p>${escapeHtml(data.message).replace(/\n/g, '<br/>')}</p>
         ${validFiles.length > 0 ? `<p><strong>${validFiles.length} pièce(s) jointe(s)</strong></p>` : ''}
         <hr/>
         <p style="color:#888;font-size:12px;">Voir dans l'admin : ${process.env.NEXTAUTH_URL || 'https://franceguichet.fr'}/gestion/contacts/${submission.id}</p>`,
      );
    } catch {
      // Non-bloquant
    }

    return NextResponse.json({ success: true, reference });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.flatten() }, { status: 400 });
    }
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Erreur interne', message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
