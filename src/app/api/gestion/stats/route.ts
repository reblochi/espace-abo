// API Admin - Statistiques dashboard

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent } from '@/lib/admin-auth';

export async function GET() {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const now = new Date();
  const twoMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 2, 1);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    activeSubscriptions,
    // Revenu total = somme de toutes les factures (les avoirs ont des montants negatifs)
    totalRevenueAgg,
    monthlyRevenueAgg,
    openDisputes,
    totalDisputes,
    expiringCards,
    totalProcesses,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    // Toutes les factures payees (SUBSCRIPTION + PROCESS + CREDIT_NOTE)
    // Les avoirs ont des totalCents negatifs, donc la somme donne le net
    prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { totalCents: true },
    }),
    // Meme chose pour le mois en cours
    prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: monthStart },
      },
      _sum: { totalCents: true },
    }),
    prisma.dispute.count({
      where: { status: { in: ['NEEDS_RESPONSE', 'UNDER_REVIEW'] } },
    }),
    prisma.dispute.count(),
    prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        cardExpYear: { not: null },
        cardExpMonth: { not: null },
        OR: [
          // Carte deja expiree ou expirant dans les 2 prochains mois
          { cardExpYear: { lt: now.getFullYear() } },
          {
            cardExpYear: now.getFullYear(),
            cardExpMonth: { lt: now.getMonth() + 1 },
          },
          // Expirant dans les 2 prochains mois
          {
            cardExpYear: twoMonthsFromNow.getFullYear(),
            cardExpMonth: { lte: twoMonthsFromNow.getMonth() + 1 },
          },
        ],
      },
    }),
    prisma.process.count(),
  ]);

  return NextResponse.json({
    totalUsers,
    activeSubscriptions,
    totalRevenueCents: totalRevenueAgg._sum.totalCents || 0,
    monthlyRevenueCents: monthlyRevenueAgg._sum.totalCents || 0,
    openDisputes,
    totalDisputes,
    expiringCards,
    totalProcesses,
  });
}
