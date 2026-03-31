// API Admin - Liste litiges

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent } from '@/lib/admin-auth';
import { adminDisputeSearchSchema } from '@/schemas/admin';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = adminDisputeSearchSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Parametres invalides', details: parsed.error.flatten() }, { status: 400 });
  }

  const { status, dateFrom, dateTo, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.DisputeWhereInput = {};
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.disputedAt = {};
    if (dateFrom) where.disputedAt.gte = new Date(dateFrom);
    if (dateTo) where.disputedAt.lte = new Date(dateTo + 'T23:59:59Z');
  }

  const [disputes, total] = await Promise.all([
    prisma.dispute.findMany({
      where,
      include: {
        creditNote: { select: { id: true, number: true } },
      },
      orderBy: { disputedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.dispute.count({ where }),
  ]);

  return NextResponse.json({
    items: disputes,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
