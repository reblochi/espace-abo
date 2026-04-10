// API Route - Telechargement document

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getFileFromStorage } from '@/lib/storage';

// GET /api/documents/:id/download - Telecharger un document
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
    });

    if (!document) {
      return NextResponse.json({ error: 'Document non trouve' }, { status: 404 });
    }

    // Recuperer le fichier depuis le stockage
    const fileBuffer = await getFileFromStorage(document.fileName);

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${document.originalName.replace(/["\\\r\n]/g, '_')}"`,
        'Content-Length': String(document.size),
      },
    });
  } catch (error) {
    console.error('Erreur telechargement document:', error);
    return NextResponse.json(
      { error: 'Erreur lors du telechargement' },
      { status: 500 }
    );
  }
}
