// API Route - Reinitialisation du mot de passe avec token

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token et mot de passe requis' },
        { status: 400 }
      );
    }

    // Validation du mot de passe
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caracteres' },
        { status: 400 }
      );
    }

    // Chercher l'utilisateur avec ce token
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Lien invalide ou expire. Veuillez refaire une demande de reinitialisation.' },
        { status: 400 }
      );
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await bcrypt.hash(password, 12);

    // Mettre a jour l'utilisateur
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    // Envoyer un email de confirmation
    await sendEmail({
      to: user.email,
      subject: 'Votre mot de passe a ete modifie',
      template: 'password-changed',
      data: {
        firstName: user.firstName,
      },
    });

    return NextResponse.json({
      message: 'Votre mot de passe a ete modifie avec succes.',
    });
  } catch (error) {
    console.error('Erreur reset-password:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

// Verifier si un token est valide
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token requis' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(),
        },
      },
      select: {
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        valid: false,
        error: 'Lien invalide ou expire',
      });
    }

    return NextResponse.json({
      valid: true,
      email: user.email,
    });
  } catch (error) {
    console.error('Erreur verification token:', error);
    return NextResponse.json(
      { valid: false, error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
