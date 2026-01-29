// API Route - Abonnement de l'utilisateur courant

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET /api/subscriptions/me - Recuperer l'abonnement courant
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      include: {
        deadlines: {
          orderBy: { deadlineNumber: 'desc' },
          take: 5,
        },
      },
    });

    if (!subscription) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Erreur recuperation abonnement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation de l\'abonnement' },
      { status: 500 }
    );
  }
}
