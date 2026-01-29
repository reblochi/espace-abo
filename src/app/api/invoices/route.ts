// API Route - Factures

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { paginationSchema } from '@/schemas';

// GET /api/invoices - Liste des factures
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          userId: session.user.id,
          status: { not: 'DRAFT' },
        },
        include: {
          process: {
            select: {
              reference: true,
              type: true,
            },
          },
          deadline: {
            select: {
              deadlineNumber: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({
        where: {
          userId: session.user.id,
          status: { not: 'DRAFT' },
        },
      }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur liste factures:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des factures' },
      { status: 500 }
    );
  }
}
