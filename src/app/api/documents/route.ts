// API Route - Documents

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { paginationSchema } from '@/schemas';

// GET /api/documents - Liste des documents de l'utilisateur
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

    const [documents, total] = await Promise.all([
      prisma.processFile.findMany({
        where: {
          userId: session.user.id,
          deleted: false,
        },
        include: {
          process: {
            select: {
              reference: true,
              type: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.processFile.count({
        where: {
          userId: session.user.id,
          deleted: false,
        },
      }),
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur liste documents:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des documents' },
      { status: 500 }
    );
  }
}
