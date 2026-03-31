// API - Téléchargement PDF d'un courrier existant

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateCourrierPdf } from '@/lib/courrier-pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { id } = await params;

  const courrier = await prisma.courrier.findUnique({ where: { id } });
  if (!courrier || courrier.userId !== session.user.id) {
    return NextResponse.json({ error: 'Courrier non trouvé' }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true, address: true, zipCode: true, city: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
  }

  const pdfBuffer = await generateCourrierPdf({
    templateId: courrier.templateId,
    senderName: `${user.firstName} ${user.lastName}`,
    senderAddress: user.address || '',
    senderZip: user.zipCode || '',
    senderCity: user.city || '',
    data: courrier.data as Record<string, string>,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="courrier-${courrier.id}.pdf"`,
    },
  });
}
