// API Admin - Liste des soumissions contact

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent } from '@/lib/admin-auth';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(params.get('limit') || '20')));
  const status = params.get('status') || undefined;
  const search = params.get('search') || undefined;
  const skip = (page - 1) * limit;

  const where: Prisma.ContactSubmissionWhereInput = {};
  if (status) {
    where.status = status as Prisma.EnumContactStatusFilter;
  }
  if (search) {
    where.OR = [
      { reference: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [contacts, total] = await Promise.all([
    prisma.contactSubmission.findMany({
      where,
      include: {
        _count: { select: { replies: true, files: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.contactSubmission.count({ where }),
  ]);

  return NextResponse.json({
    contacts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
