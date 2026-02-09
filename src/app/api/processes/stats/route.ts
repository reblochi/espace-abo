// API Route - Statistiques demarches

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET /api/processes/stats - Statistiques des demarches de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userId = session.user.id;

    // Compter par statut
    const [total, inProgress, awaitingInfo, completed, pendingPayment] = await Promise.all([
      prisma.process.count({
        where: { userId },
      }),
      prisma.process.count({
        where: {
          userId,
          status: { in: ['IN_PROGRESS', 'SENT_TO_ADVERCITY', 'PAID'] },
        },
      }),
      prisma.process.count({
        where: { userId, status: 'AWAITING_INFO' },
      }),
      prisma.process.count({
        where: { userId, status: 'COMPLETED' },
      }),
      prisma.process.count({
        where: { userId, status: 'PENDING_PAYMENT' },
      }),
    ]);

    return NextResponse.json({
      total,
      inProgress,
      awaitingInfo,
      completed,
      pendingPayment,
    });
  } catch (error) {
    console.error('Erreur stats demarches:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des statistiques' },
      { status: 500 }
    );
  }
}
