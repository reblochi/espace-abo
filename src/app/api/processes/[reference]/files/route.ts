// API Route - Fichiers d'une demarche

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { uploadToStorage } from '@/lib/storage';
import { uploadFileSchema } from '@/schemas';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/types/document';

// GET /api/processes/:reference/files - Liste fichiers d'une demarche
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const process = await prisma.process.findFirst({
      where: {
        reference,
        userId: session.user.id,
      },
      include: {
        files: {
          where: { deleted: false },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!process) {
      return NextResponse.json({ error: 'Demarche non trouvee' }, { status: 404 });
    }

    return NextResponse.json({
      files: process.files,
      mandatoryFileTypes: process.mandatoryFileTypes,
    });
  } catch (error) {
    console.error('Erreur liste fichiers:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des fichiers' },
      { status: 500 }
    );
  }
}

// POST /api/processes/:reference/files - Upload fichier
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;

    // Valider le type de fichier
    const validation = uploadFileSchema.safeParse({ fileType });
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Type de fichier invalide', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
    }

    // Valider le mime type
    if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
      return NextResponse.json(
        { error: 'Type de fichier non autorise. Formats acceptes: PDF, JPG, PNG, WebP' },
        { status: 400 }
      );
    }

    // Valider la taille
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 5 Mo)' },
        { status: 400 }
      );
    }

    // Verifier que la demarche appartient a l'utilisateur
    const process = await prisma.process.findFirst({
      where: {
        reference,
        userId: session.user.id,
      },
    });

    if (!process) {
      return NextResponse.json({ error: 'Demarche non trouvee' }, { status: 404 });
    }

    // Upload vers le stockage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { fileName, storageUrl } = await uploadToStorage(
      fileBuffer,
      file.name,
      file.type,
      `processes/${process.id}`
    );

    // Creer l'entree en base
    const processFile = await prisma.processFile.create({
      data: {
        processId: process.id,
        userId: session.user.id,
        originalName: file.name,
        fileName,
        mimeType: file.type,
        size: file.size,
        fileType: fileType as 'CNI' | 'PASSEPORT' | 'PERMIS' | 'JUSTIFICATIF_DOMICILE' | 'PHOTO_IDENTITE' | 'ACTE_NAISSANCE' | 'LIVRET_FAMILLE' | 'AUTRE',
        storageKey: fileName,
        storageUrl,
      },
    });

    return NextResponse.json(processFile, { status: 201 });
  } catch (error) {
    console.error('Erreur upload fichier:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du fichier' },
      { status: 500 }
    );
  }
}
