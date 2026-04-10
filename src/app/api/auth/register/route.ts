// API Route - Inscription

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registerSchema } from '@/schemas';
import { sendEmail } from '@/lib/email';
import { generateClientReference } from '@/lib/client-reference';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rl = checkRateLimit(RATE_LIMITS.register, ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez reessayer plus tard.' },
        { status: 429 }
      );
    }
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation echouee', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, phone } = result.data;

    // Verifier si l'email existe deja
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Message generique : ne pas reveler si le compte existe
      return NextResponse.json(
        { error: 'Impossible de creer le compte. Si vous avez deja un compte, utilisez "Mot de passe oublie" pour y acceder.' },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 12);

    // Creer l'utilisateur
    const reference = await generateClientReference();
    const user = await prisma.user.create({
      data: {
        reference,
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    // Envoyer email de bienvenue (avec auto-login)
    await sendEmail({
      to: email,
      subject: 'Bienvenue !',
      template: 'welcome',
      data: {
        firstName,
      },
      userId: user.id,
    });

    return NextResponse.json(
      { user, message: 'Compte cree avec succes' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur inscription:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    );
  }
}
