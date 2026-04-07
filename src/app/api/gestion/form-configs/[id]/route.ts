// API Admin - Detail/modification d'une configuration formulaire

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent } from '@/lib/admin-auth';

const updateSchema = z.object({
  pricingProfileId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const { id } = await params;
  const config = await prisma.formConfig.findUnique({
    where: { id },
    include: { pricingProfile: true },
  });

  if (!config) {
    return NextResponse.json({ error: 'Configuration introuvable' }, { status: 404 });
  }

  return NextResponse.json(config);
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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 });
  }

  const existing = await prisma.formConfig.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Configuration introuvable' }, { status: 404 });
  }

  const config = await prisma.formConfig.update({
    where: { id },
    data: parsed.data,
    include: { pricingProfile: true },
  });

  return NextResponse.json(config);
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
  await prisma.formConfig.delete({ where: { id } }).catch(() => null);

  return NextResponse.json({ ok: true });
}
