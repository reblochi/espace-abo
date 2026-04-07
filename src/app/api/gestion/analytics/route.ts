// API Admin - Analytique formulaires
// Funnels step-by-step, conversion par pricing/partenaire, breakdown paiement

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent } from '@/lib/admin-auth';

function getDateRange(period: string): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  switch (period) {
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '90d':
      from.setDate(from.getDate() - 90);
      break;
    case 'all':
      from.setFullYear(2020);
      break;
    case '30d':
    default:
      from.setDate(from.getDate() - 30);
      break;
  }
  return { from, to };
}

export async function GET(request: NextRequest) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const period = searchParams.get('period') || '30d';
  const formTypeFilter = searchParams.get('formType') || null;
  const pricingCodeFilter = searchParams.get('pricingCode') || null;
  const { from, to } = getDateRange(period);

  const dateFilter = { gte: from, lte: to };
  const formEventWhere: Record<string, unknown> = { createdAt: dateFilter };
  const processWhere: Record<string, unknown> = { createdAt: dateFilter };
  if (formTypeFilter) {
    formEventWhere.formType = formTypeFilter;
    processWhere.type = formTypeFilter;
  }
  if (pricingCodeFilter) {
    formEventWhere.pricingCode = pricingCodeFilter;
    processWhere.pricingCode = pricingCodeFilter;
  }

  const [funnelRaw, byPricingRaw, byPartnerRaw, subscriptionCount, oneTimeCount] = await Promise.all([
    // Funnel : count par formType + stepIndex + event
    prisma.formEvent.groupBy({
      by: ['formType', 'stepIndex', 'stepName', 'event'],
      where: formEventWhere as any,
      _count: true,
      orderBy: [{ formType: 'asc' }, { stepIndex: 'asc' }],
    }),

    // Par pricing profile
    prisma.process.groupBy({
      by: ['pricingCode'] as any,
      where: processWhere as any,
      _count: true,
    }) as any,

    // Par partenaire + source
    prisma.process.groupBy({
      by: ['partner', 'source'] as any,
      where: processWhere as any,
      _count: true,
    }) as any,

    // Abo vs acte
    prisma.process.count({
      where: { ...processWhere, isFromSubscription: true } as any,
    }),
    prisma.process.count({
      where: { ...processWhere, isFromSubscription: false } as any,
    }),
  ]);

  // Construire les funnels par formType
  const funnelMap = new Map<string, Map<number, { stepName: string; entered: number; completed: number }>>();

  for (const row of funnelRaw) {
    if (!funnelMap.has(row.formType)) {
      funnelMap.set(row.formType, new Map());
    }
    const steps = funnelMap.get(row.formType)!;

    // Ignorer les events globaux (stepIndex -1 = FORM_STARTED, FORM_COMPLETED, FORM_ABANDONED)
    if (row.stepIndex < 0) continue;

    if (!steps.has(row.stepIndex)) {
      steps.set(row.stepIndex, { stepName: row.stepName, entered: 0, completed: 0 });
    }
    const step = steps.get(row.stepIndex)!;
    if (row.event === 'STEP_ENTERED') step.entered += row._count;
    if (row.event === 'STEP_COMPLETED') step.completed += row._count;
  }

  // Compter FORM_STARTED et FORM_COMPLETED par formType
  const formStarted = new Map<string, number>();
  const formCompleted = new Map<string, number>();
  for (const row of funnelRaw) {
    if (row.event === 'FORM_STARTED') {
      formStarted.set(row.formType, (formStarted.get(row.formType) || 0) + row._count);
    }
    if (row.event === 'FORM_COMPLETED') {
      formCompleted.set(row.formType, (formCompleted.get(row.formType) || 0) + row._count);
    }
  }

  const funnels = Array.from(funnelMap.entries()).map(([formType, stepsMap]) => {
    const steps = Array.from(stepsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([stepIndex, data], i, arr) => {
        const prevEntered = i === 0 ? (formStarted.get(formType) || data.entered) : arr[i - 1][1].entered;
        const dropOffRate = prevEntered > 0 ? Math.round((1 - data.entered / prevEntered) * 100) : 0;
        return { stepIndex, ...data, dropOffRate };
      });

    const totalStarted = formStarted.get(formType) || 0;
    const totalCompletedCount = formCompleted.get(formType) || 0;
    const conversionRate = totalStarted > 0 ? Math.round((totalCompletedCount / totalStarted) * 100) : 0;

    return { formType, steps, totalStarted, totalCompleted: totalCompletedCount, conversionRate };
  });

  // Compter les process completes par pricing
  const completedStatuses = ['PAID', 'SENT_TO_ADVERCITY', 'IN_PROGRESS', 'COMPLETED'];
  const byPricingCompleted = await (prisma.process.groupBy as any)({
    by: ['pricingCode'],
    where: { ...processWhere, status: { in: completedStatuses } },
    _count: true,
  }) as { pricingCode: string | null; _count: number }[];
  const completedByPricing = new Map(byPricingCompleted.map((r: any) => [r.pricingCode, r._count]));

  const byPricing = (byPricingRaw as any[]).map((row: any) => {
    const completed = completedByPricing.get(row.pricingCode) || 0;
    return {
      pricingCode: row.pricingCode || 'non-defini',
      total: row._count,
      completed,
      conversionRate: row._count > 0 ? Math.round((completed / row._count) * 100) : 0,
    };
  });

  const byPartner = (byPartnerRaw as any[]).map((row: any) => ({
    partner: row.partner || 'direct',
    source: row.source || 'inconnu',
    total: row._count,
  }));

  return NextResponse.json({
    funnels,
    byPricing,
    byPartner,
    paymentBreakdown: {
      subscription: subscriptionCount,
      oneTime: oneTimeCount,
    },
  });
}
