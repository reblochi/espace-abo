// API Route - Changement de mot de passe

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { changePasswordSchema } from '@/schemas';
import { sendEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json();
    const result = changePasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation echouee', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = result.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    // Verifier le mot de passe actuel si l'utilisateur en a un
    if (user.passwordHash && currentPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Mot de passe actuel incorrect' },
          { status: 400 }
        );
      }
    } else if (user.passwordHash && !currentPassword) {
      return NextResponse.json(
        { error: 'Mot de passe actuel requis' },
        { status: 400 }
      );
    }

    // Hasher le nouveau mot de passe
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Email de confirmation
    await sendEmail({
      to: user.email,
      subject: 'Mot de passe modifie',
      template: 'password-changed',
      data: { firstName: user.firstName },
    });

    return NextResponse.json({
      success: true,
      message: 'Mot de passe modifie avec succes',
    });
  } catch (error) {
    console.error('Erreur changement mdp:', error);
    return NextResponse.json(
      { error: 'Erreur lors du changement de mot de passe' },
      { status: 500 }
    );
  }
}
