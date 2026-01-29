// API Route - Demande de reinitialisation de mot de passe

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      );
    }

    // Chercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Toujours retourner succes pour eviter l'enumeration d'emails
    if (!user) {
      return NextResponse.json({
        message: 'Si un compte existe avec cet email, vous recevrez un lien de reinitialisation.',
      });
    }

    // Generer un token unique
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    // Sauvegarder le token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    // Construire l'URL de reset
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Envoyer l'email
    await sendEmail({
      to: user.email,
      subject: 'Reinitialisation de votre mot de passe',
      template: 'password-reset',
      data: {
        firstName: user.firstName,
        resetUrl,
      },
    });

    return NextResponse.json({
      message: 'Si un compte existe avec cet email, vous recevrez un lien de reinitialisation.',
    });
  } catch (error) {
    console.error('Erreur forgot-password:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
