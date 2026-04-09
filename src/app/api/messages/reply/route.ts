// API Route - Repondre a un message (demarche via pluckmail ou contact local)
// Supporte FormData avec fichiers joints

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendRawEmail } from '@/lib/email';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const type = formData.get('type') as string;
    const id = formData.get('id') as string;
    const message = (formData.get('message') as string)?.trim();

    if (!type || !id || !message) {
      return NextResponse.json({ error: 'Champs requis: type, id, message' }, { status: 400 });
    }

    // Extraire les fichiers valides
    const files = formData.getAll('files') as File[];
    const validFiles = files.filter(
      (f) => f instanceof File && f.size > 0 && f.size <= MAX_FILE_SIZE && ALLOWED_TYPES.includes(f.type),
    ).slice(0, MAX_FILES);

    // Preparer les attachments pour l'email
    const attachments: { filename: string; content: Buffer }[] = [];
    for (const file of validFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      attachments.push({ filename: file.name, content: buffer });
    }

    if (type === 'process') {
      return await handleProcessReply(user, id, message, attachments);
    } else {
      return await handleContactReply(user, id, message, attachments);
    }
  } catch (error) {
    console.error('Reply error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

async function handleProcessReply(
  user: { id: string; email: string; firstName: string; lastName: string },
  advercityRef: string,
  message: string,
  attachments: { filename: string; content: Buffer }[],
) {
  // Verifier que le user a bien une demarche avec cette ref Advercity
  const proc = await prisma.process.findFirst({
    where: {
      userId: user.id,
      advercityRef,
    },
  });

  if (!proc) {
    return NextResponse.json({ error: 'Démarche non trouvée' }, { status: 404 });
  }

  // Envoyer email via Resend -> pluckmail.fr
  // L'import IMAP Advercity va recuperer le message + les PJ automatiquement
  const pluckmailAddress = `${advercityRef.toLowerCase()}@pluckmail.fr`;

  const pjNote = attachments.length > 0
    ? `<p><em>${attachments.length} pièce(s) jointe(s)</em></p>`
    : '';

  await sendRawEmail(
    pluckmailAddress,
    `Re: Démarche ${advercityRef}`,
    `<p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
     ${pjNote}
     <p>--<br/>
     ${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}<br/>
     ${escapeHtml(user.email)}<br/>
     <em>Envoyé depuis l'espace membre FranceGuichet</em></p>`,
    attachments.length > 0 ? attachments : undefined,
  );

  return NextResponse.json({ success: true });
}

async function handleContactReply(
  user: { id: string; email: string; firstName: string; lastName: string },
  contactId: string,
  message: string,
  attachments: { filename: string; content: Buffer }[],
) {
  // Verifier que le contact appartient bien au user
  const contact = await prisma.contactSubmission.findFirst({
    where: {
      id: contactId,
      email: user.email.toLowerCase(),
    },
  });

  if (!contact) {
    return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 });
  }

  // Creer la reponse
  await prisma.contactReply.create({
    data: {
      contactId: contact.id,
      sender: 'customer',
      senderName: `${user.firstName} ${user.lastName}`,
      message,
    },
  });

  // Uploader les fichiers sur Supabase Storage et les lier au contact
  if (attachments.length > 0) {
    try {
      const { uploadToStorage } = await import('@/lib/storage');
      for (const att of attachments) {
        const { fileName: fileKey } = await uploadToStorage(att.content, att.filename, 'application/octet-stream', 'contacts');
        await prisma.contactFile.create({
          data: {
            contactId: contact.id,
            fileName: att.filename,
            fileKey,
            fileSize: att.content.length,
            mimeType: 'application/octet-stream',
          },
        });
      }
    } catch {
      // Non-bloquant si storage non configure
    }
  }

  // Remettre le statut a NEW si le contact etait en attente client
  if (contact.status === 'WAITING_CUSTOMER' || contact.status === 'RESOLVED') {
    await prisma.contactSubmission.update({
      where: { id: contact.id },
      data: { status: 'NEW' },
    });
  }

  // Notifier l'admin
  const adminEmail = process.env.ADMIN_CONTACT_EMAIL || 'contact@franceguichet.fr';
  try {
    await sendRawEmail(
      adminEmail,
      `[Réponse ${contact.reference}] Nouveau message client`,
      `<p><strong>De :</strong> ${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)} (${escapeHtml(user.email)})</p>
       <p><strong>Réf :</strong> ${contact.reference}</p>
       <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
       ${attachments.length > 0 ? `<p><em>${attachments.length} pièce(s) jointe(s)</em></p>` : ''}
       <hr/>
       <p style="color:#888;font-size:12px;">Voir dans l'admin : ${process.env.NEXTAUTH_URL || 'https://franceguichet.fr'}/gestion/contacts/${contact.id}</p>`,
      attachments.length > 0 ? attachments : undefined,
    );
  } catch {
    // Non-bloquant
  }

  return NextResponse.json({ success: true });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
