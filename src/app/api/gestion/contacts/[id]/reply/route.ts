// API Admin - Repondre a un contact

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent } from '@/lib/admin-auth';
import { sendRawEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const message = body.message?.trim();

  if (!message) {
    return NextResponse.json({ error: 'Message requis' }, { status: 400 });
  }

  const contact = await prisma.contactSubmission.findUnique({ where: { id } });
  if (!contact) {
    return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 });
  }

  // Creer la reponse
  const reply = await prisma.contactReply.create({
    data: {
      contactId: contact.id,
      sender: 'admin',
      senderName: session.user.email || 'Support FranceGuichet',
      message,
    },
  });

  // Mettre a jour le statut
  await prisma.contactSubmission.update({
    where: { id },
    data: {
      status: 'WAITING_CUSTOMER',
      repliedAt: new Date(),
      assignedTo: session.user.id,
    },
  });

  // Envoyer l'email au client
  try {
    await sendRawEmail(
      contact.email,
      `Re: [${contact.reference}] Votre demande`,
      `<p>Bonjour ${escapeHtml(contact.firstName)},</p>
       <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
       <p>--<br/>
       L'équipe FranceGuichet<br/>
       <em>Réf: ${contact.reference}</em></p>`,
    );
  } catch (err) {
    console.error('Failed to send reply email:', err);
    // On retourne quand meme la reponse creee
  }

  return NextResponse.json(reply);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
