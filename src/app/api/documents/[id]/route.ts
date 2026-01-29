// API Route - Detail et suppression document

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET /api/documents/:id - Detail d'un document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const document = await prisma.processFile.findFirst({
      where: {
        id,
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
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouve' }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error('Erreur detail document:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du document' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/:id - Suppression (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const document = await prisma.processFile.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouve' }, { status: 404 });
    }

    await prisma.processFile.update({
      where: { id },
      data: {
        deleted: true,
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression document:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
