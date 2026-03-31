// API Admin - Liste clients avec recherche

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent } from '@/lib/admin-auth';
import { adminUserSearchSchema } from '@/schemas/admin';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = adminUserSearchSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Parametres invalides', details: parsed.error.flatten() }, { status: 400 });
  }

  const { search, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  let where: Prisma.UserWhereInput = {};

  if (search) {
    // Chercher d'abord si c'est une reference demarche (DEM-YYYY-XXXXXX)
    if (search.startsWith('DEM-')) {
      const process = await prisma.process.findUnique({
        where: { reference: search },
        select: { userId: true },
      });
      if (process) {
        where = { id: process.userId };
      } else {
        // Aucune demarche trouvee -> aucun resultat
        return NextResponse.json({ items: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }
    } else {
      where = {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { id: search },
          { reference: search },
          // Recherche par reference abo
          { subscription: { reference: { contains: search, mode: 'insensitive' } } },
        ],
      };
    }
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        reference: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        zipCode: true,
        city: true,
        role: true,
        createdAt: true,
        subscription: {
          select: {
            id: true,
            status: true,
            reference: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    items: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
