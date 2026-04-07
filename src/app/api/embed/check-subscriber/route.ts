// API publique - Verifie si un email ou telephone correspond a un abonne actif
// Utilise dans le formulaire embed pour adapter le pricing en temps reel

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, phone } = await request.json();

    if (!email && !phone) {
      return NextResponse.json({ isSubscriber: false });
    }

    // Chercher l'utilisateur par email ou telephone
    let user = email
      ? await prisma.user.findUnique({ where: { email } })
      : null;

    if (!user && phone) {
      const normalizedPhone = phone.replace(/[\s\-.]/g, '');
      user = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
    }

    if (!user) {
      return NextResponse.json({ isSubscriber: false });
    }

    // Verifier s'il a un abonnement actif
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        OR: [
          { status: 'ACTIVE' },
          { status: 'CANCELED', endDate: { gte: new Date() } },
        ],
      },
      select: { id: true, status: true },
    });

    return NextResponse.json({
      isSubscriber: !!subscription,
    });
  } catch {
    return NextResponse.json({ isSubscriber: false });
  }
}
