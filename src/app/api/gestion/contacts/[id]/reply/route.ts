// API Admin - Repondre a un contact

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent } from '@/lib/admin-auth';
import { sendEmail } from '@/lib/email';

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

  // Envoyer l'email au client via le template contact-admin-reply (avec auto-login si user existe)
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: contact.email.toLowerCase() },
      select: { id: true },
    });
    await sendEmail({
      to: contact.email,
      template: 'contact-admin-reply',
      data: {
        firstName: contact.firstName,
        lastName: contact.lastName,
        reference: contact.reference,
        message: message.replace(/\n/g, '<br/>'),
      },
      userId: existingUser?.id,
    });
  } catch (err) {
    console.error('Failed to send reply email:', err);
    // On retourne quand meme la reponse creee
  }

  return NextResponse.json(reply);
}
