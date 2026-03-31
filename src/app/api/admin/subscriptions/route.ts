// API Admin - Liste abonnements

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent } from '@/lib/admin-auth';
import { adminSubscriptionSearchSchema } from '@/schemas/admin';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = adminSubscriptionSearchSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Parametres invalides', details: parsed.error.flatten() }, { status: 400 });
  }

  const { search, status, cardExpiring, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.SubscriptionWhereInput = {};

  if (search) {
    where.user = {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  if (status) where.status = status;

  // Filtre cartes expirees ou expirant dans les 2 prochains mois (abos actifs seulement)
  if (cardExpiring) {
    const now = new Date();
    const twoMonths = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    if (!status) where.status = 'ACTIVE'; // Seulement les abos actifs si pas d'autre filtre statut
    where.cardExpYear = { not: null };
    where.OR = [
      { cardExpYear: { lt: twoMonths.getFullYear() } },
      {
        cardExpYear: twoMonths.getFullYear(),
        cardExpMonth: { lte: twoMonths.getMonth() + 1 },
      },
    ];
  }

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        deadlines: {
          orderBy: { deadlineNumber: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.subscription.count({ where }),
  ]);

  // Ajouter le flag cardExpiringSoon
  const now = new Date();
  const twoMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 2, 1);
  const items = subscriptions.map((sub) => ({
    ...sub,
    cardExpiringSoon:
      sub.cardExpYear && sub.cardExpMonth
        ? new Date(sub.cardExpYear, sub.cardExpMonth, 0) <= twoMonthsFromNow
        : false,
  }));

  return NextResponse.json({
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
