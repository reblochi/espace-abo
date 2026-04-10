// API Route - Demande de reinitialisation de mot de passe

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { forgotPasswordSchema } from '@/schemas/auth';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rl = checkRateLimit(RATE_LIMITS.forgotPassword, ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez reessayer plus tard.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      // Message generique (anti-enumeration)
      return NextResponse.json({
        message: 'Si un compte existe avec cet email, vous recevrez un lien de reinitialisation.',
      });
    }

    const { email } = parsed.data;

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
