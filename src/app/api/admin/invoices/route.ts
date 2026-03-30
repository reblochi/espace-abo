// API Admin - Liste factures avec recherche

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { adminInvoiceSearchSchema } from '@/schemas/admin';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = adminInvoiceSearchSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Parametres invalides', details: parsed.error.flatten() }, { status: 400 });
  }

  const { search, type, status, dateFrom, dateTo, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const where: Prisma.InvoiceWhereInput = {};

  // Filtre recherche (email, nom, userId)
  if (search) {
    where.OR = [
      { userId: search },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { user: { firstName: { contains: search, mode: 'insensitive' } } },
      { user: { lastName: { contains: search, mode: 'insensitive' } } },
      { number: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (type) where.type = type;
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
  }

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        process: { select: { reference: true, type: true } },
        deadline: { select: { deadlineNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({
    items: invoices,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
