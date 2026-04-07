// API Admin - Gestion des configurations formulaires

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent } from '@/lib/admin-auth';

const formConfigSchema = z.object({
  formType: z.string().min(1),
  partner: z.string().min(1).max(100).default('default'),
  pricingProfileId: z.string().min(1),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const configs = await prisma.formConfig.findMany({
    include: { pricingProfile: true },
    orderBy: [{ formType: 'asc' }, { partner: 'asc' }],
  });

  // Stats par config : nombre de process + nombre de form events
  const formTypes = [...new Set(configs.map((c) => c.formType))];
  const partners = [...new Set(configs.map((c) => c.partner))];

  // Process counts par formType + partner
  const processCounts = await (prisma.process.groupBy as any)({
    by: ['type', 'partner', 'pricingCode'],
    _count: { id: true },
    where: {
      type: { in: formTypes },
    },
  }).catch(() => []) as any[];

  // FormEvent counts (FORM_STARTED et FORM_COMPLETED) par formType + partner
  const eventCounts = await prisma.formEvent.groupBy({
    by: ['formType', 'partner', 'event'],
    _count: true,
    where: {
      formType: { in: formTypes as any },
      event: { in: ['FORM_STARTED', 'FORM_COMPLETED'] },
    },
  }).catch(() => []);

  // Construire les maps de stats
  const items = configs.map((config) => {
    const processCount = processCounts
      .filter((r: any) => r.type === config.formType && (r.partner === config.partner || (!r.partner && config.partner === 'default')))
      .reduce((sum: number, r: any) => sum + r._count.id, 0);

    const started = eventCounts
      .filter((r) => r.formType === config.formType && (r.partner === config.partner || (!r.partner && config.partner === 'default')) && r.event === 'FORM_STARTED')
      .reduce((sum, r) => sum + r._count, 0);

    const completed = eventCounts
      .filter((r) => r.formType === config.formType && (r.partner === config.partner || (!r.partner && config.partner === 'default')) && r.event === 'FORM_COMPLETED')
      .reduce((sum, r) => sum + r._count, 0);

    const conversionRate = started > 0 ? Math.round((completed / started) * 100) : 0;

    return {
      ...config,
      stats: { processCount, started, completed, conversionRate },
    };
  });

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
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  const parsed = formConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Donnees invalides', details: parsed.error.flatten() }, { status: 400 });
  }

  const { formType, partner, pricingProfileId, isActive } = parsed.data;

  // Verifier que le pricing profile existe
  const profile = await prisma.pricingProfile.findUnique({ where: { id: pricingProfileId } });
  if (!profile) {
    return NextResponse.json({ error: 'Profil de tarification introuvable' }, { status: 400 });
  }

  // Upsert : si la combinaison formType+partner existe, on met a jour
  const config = await prisma.formConfig.upsert({
    where: { formType_partner: { formType: formType as any, partner } },
    create: {
      formType: formType as any,
      partner,
      pricingProfileId,
      isActive,
    },
    update: {
      pricingProfileId,
      isActive,
    },
    include: { pricingProfile: true },
  });

  return NextResponse.json(config, { status: 201 });
}
