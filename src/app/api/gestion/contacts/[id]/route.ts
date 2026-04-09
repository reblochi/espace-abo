// API Admin - Detail et mise a jour d'un contact

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { id } = await params;

  const contact = await prisma.contactSubmission.findUnique({
    where: { id },
    include: {
      replies: { orderBy: { sentAt: 'asc' } },
      files: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!contact) {
    return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 });
  }

  // Generer les URLs signees pour les fichiers
  let filesWithUrls = contact.files;
  try {
    const { getSignedDownloadUrl } = await import('@/lib/storage');
    filesWithUrls = await Promise.all(
      contact.files.map(async (f) => ({
        ...f,
        downloadUrl: await getSignedDownloadUrl(f.fileKey).catch(() => null),
      })),
    );
  } catch {
    // Storage non configure
  }

  return NextResponse.json({
    ...contact,
    files: filesWithUrls,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const validStatuses = ['NEW', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'];
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
  }

  const contact = await prisma.contactSubmission.findUnique({ where: { id } });
  if (!contact) {
    return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 });
  }

  const updated = await prisma.contactSubmission.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.assignedTo !== undefined ? { assignedTo: body.assignedTo } : {}),
    },
  });

  return NextResponse.json(updated);
}
