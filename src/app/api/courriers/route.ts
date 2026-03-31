// API - Courriers : liste (GET) et création (POST)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getTemplate } from '@/lib/courrier-templates';
import { generateCourrierPdf } from '@/lib/courrier-pdf';
import { z } from 'zod';

const MONTHLY_LIMIT = 3;

const createCourrierSchema = z.object({
  templateId: z.string(),
  data: z.record(z.string()),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // Courriers du user + compteur du mois
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [courriers, monthCount] = await Promise.all([
    prisma.courrier.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.courrier.count({
      where: { userId: session.user.id, createdAt: { gte: startOfMonth } },
    }),
  ]);

  return NextResponse.json({ courriers, monthCount, monthlyLimit: MONTHLY_LIMIT });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  // Vérifier abonnement actif
  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });
  if (!subscription || subscription.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Abonnement actif requis' }, { status: 403 });
  }

  // Vérifier quota mensuel
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthCount = await prisma.courrier.count({
    where: { userId: session.user.id, createdAt: { gte: startOfMonth } },
  });
  if (monthCount >= MONTHLY_LIMIT) {
    return NextResponse.json({ error: `Limite de ${MONTHLY_LIMIT} courriers par mois atteinte` }, { status: 429 });
  }

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Body invalide' }, { status: 400 }); }
  const parsed = createCourrierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }

  const { templateId, data } = parsed.data;
  const template = getTemplate(templateId);
  if (!template) {
    return NextResponse.json({ error: 'Modèle inconnu' }, { status: 400 });
  }

  // Récupérer le profil pour pré-remplir l'expéditeur
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true, address: true, zipCode: true, city: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
  }

  // Générer le PDF
  const pdfBuffer = await generateCourrierPdf({
    templateId,
    senderName: `${user.firstName} ${user.lastName}`,
    senderAddress: user.address || '',
    senderZip: user.zipCode || '',
    senderCity: user.city || '',
    data,
  });

  // Sauvegarder en BDD
  const courrier = await prisma.courrier.create({
    data: {
      userId: session.user.id,
      templateId,
      title: template.title,
      data: JSON.parse(JSON.stringify(data)),
    },
  });

  // Retourner le PDF directement
  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="courrier-${courrier.id}.pdf"`,
      'X-Courrier-Id': courrier.id,
    },
  });
}
