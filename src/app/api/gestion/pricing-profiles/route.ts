// API Admin - Gestion des profils de tarification

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent } from '@/lib/admin-auth';

const pricingProfileSchema = z.object({
  code: z
    .string()
    .min(1, 'Le code est requis')
    .max(20, 'Le code ne peut pas depasser 20 caracteres')
    .regex(/^[a-zA-Z0-9-]+$/, 'Le code ne peut contenir que des lettres, chiffres et tirets'),
  label: z
    .string()
    .min(1, 'Le libelle est requis')
    .max(200, 'Le libelle ne peut pas depasser 200 caracteres'),
  paymentMode: z.enum(['both', 'subscription', 'one_time', 'free'], {
    errorMap: () => ({ message: 'Mode de paiement invalide' }),
  }),
  subscriptionMonthlyPrice: z
    .number()
    .int('Le prix doit etre un entier')
    .min(0, 'Le prix ne peut pas etre negatif'),
  basePrice: z
    .number()
    .int('Le prix doit etre un entier (en centimes)')
    .min(0, 'Le prix ne peut pas etre negatif'),
});

export async function GET() {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const profiles = await prisma.pricingProfile.findMany({
    orderBy: { createdAt: 'asc' },
  });

  // Count Process records per pricingCode
  const countMap = new Map<string, number>();
  try {
    const processCounts = await (prisma.process.groupBy as any)({
      by: ['pricingCode'],
      _count: { id: true },
      where: {
        pricingCode: { not: null },
      },
    });
    for (const row of processCounts) {
      if (row.pricingCode) countMap.set(row.pricingCode, row._count.id);
    }
  } catch {
    // Si le groupBy echoue (pas de process), on continue avec des counts a 0
  }

  const items = profiles.map((profile) => ({
    ...profile,
    processCount: countMap.get(profile.code) ?? 0,
  }));

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide' }, { status: 400 });
  }

  const parsed = pricingProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Donnees invalides', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { code, label, paymentMode, subscriptionMonthlyPrice, basePrice } = parsed.data;

  // Check code uniqueness
  const existing = await prisma.pricingProfile.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json(
      { error: 'Un profil avec ce code existe deja' },
      { status: 409 }
    );
  }

  const profile = await prisma.pricingProfile.create({
    data: {
      code,
      label,
      paymentMode,
      subscriptionMonthlyPrice,
      basePrice,
    },
  });

  return NextResponse.json(profile, { status: 201 });
}
