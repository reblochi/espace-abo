// API Route: Demande de desabonnement par email

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      // Meme message que le succes (anti-enumeration)
      return NextResponse.json({
        message: 'Si un abonnement actif est associe a cette adresse, vous recevrez un email avec les instructions.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Chercher l'utilisateur et son abonnement actif
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        subscription: true,
      },
    });

    if (
      user?.subscription &&
      (user.subscription.status === 'ACTIVE' || user.subscription.status === 'PAST_DUE')
    ) {
      const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const unsubscribeUrl = `${appUrl}/desabonnement/confirmer?token=${user.subscription.unsubscribeToken}`;

      // Envoyer l'email
      await sendEmail({
        to: user.email,
        subject: 'Demande de resiliation de votre abonnement',
        template: 'unsubscribe-request',
        data: {
          firstName: user.firstName,
          unsubscribeUrl,
          reference: user.subscription.reference,
        },
      });
    }

    // Toujours retourner le meme message (anti-enumeration)
    return NextResponse.json({
      message: 'Si un abonnement actif est associe a cette adresse, vous recevrez un email avec les instructions.',
    });
  } catch (error) {
    console.error('[Unsubscribe Request] Erreur:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez reessayer.' },
      { status: 500 }
    );
  }
}
