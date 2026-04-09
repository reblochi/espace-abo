// API Route - Repondre a un message (demarche via pluckmail ou contact local)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendRawEmail } from '@/lib/email';
import { messageReplySchema } from '@/schemas/contact';

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
    const body = await request.json();
    const data = messageReplySchema.parse(body);

    if (data.type === 'process') {
      return await handleProcessReply(user, data.id, data.message);
    } else {
      return await handleContactReply(user, data.id, data.message);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    console.error('Reply error:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

async function handleProcessReply(
  user: { id: string; email: string; firstName: string; lastName: string },
  advercityRef: string,
  message: string,
) {
  // Verifier que le user a bien une demarche avec cette ref Advercity
  const process = await prisma.process.findFirst({
    where: {
      userId: user.id,
      advercityRef,
    },
  });

  if (!process) {
    return NextResponse.json({ error: 'Démarche non trouvée' }, { status: 404 });
  }

  // Envoyer email via Resend -> pluckmail.fr
  // L'import IMAP Advercity va le recuperer automatiquement
  const pluckmailAddress = `${advercityRef.toLowerCase()}@pluckmail.fr`;

  await sendRawEmail(
    pluckmailAddress,
    `Re: Démarche ${advercityRef}`,
    `<p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
     <p>--<br/>
     ${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}<br/>
     ${escapeHtml(user.email)}<br/>
     <em>Envoyé depuis l'espace membre FranceGuichet</em></p>`,
  );

  return NextResponse.json({ success: true });
}

async function handleContactReply(
  user: { id: string; email: string; firstName: string; lastName: string },
  contactId: string,
  message: string,
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
       <hr/>
       <p style="color:#888;font-size:12px;">Voir dans l'admin : ${process.env.NEXTAUTH_URL || 'https://franceguichet.fr'}/gestion/contacts/${contact.id}</p>`,
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
