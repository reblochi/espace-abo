// API Admin - Detail / mise a jour / suppression d'un profil de tarification

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent } from '@/lib/admin-auth';

const pricingProfileUpdateSchema = z.object({
  // code is intentionally excluded — not updatable
  label: z
    .string()
    .min(1, 'Le libelle est requis')
    .max(200, 'Le libelle ne peut pas depasser 200 caracteres'),
  paymentMode: z.enum(['both', 'subscription', 'one_time'], {
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
  isActive: z.boolean().optional(),
});

async function getProfileWithCount(id: string) {
  const profile = await prisma.pricingProfile.findUnique({ where: { id } });
  if (!profile) return null;

  const processCount = await prisma.process.count({
    where: { pricingCode: profile.code },
  });

  return { ...profile, processCount };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const { id } = await params;
  const profile = await getProfileWithCount(id);

  if (!profile) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
  }

  return NextResponse.json(profile);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.pricingProfile.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requete invalide' }, { status: 400 });
  }

  const parsed = pricingProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Donnees invalides', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { label, paymentMode, subscriptionMonthlyPrice, basePrice, isActive } = parsed.data;

  const updated = await prisma.pricingProfile.update({
    where: { id },
    data: {
      label,
      paymentMode,
      subscriptionMonthlyPrice,
      basePrice,
      ...(isActive !== undefined ? { isActive } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.pricingProfile.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
  }

  // Soft delete — preserve the record since pricingCode may be referenced in Process
  const updated = await prisma.pricingProfile.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json(updated);
}
