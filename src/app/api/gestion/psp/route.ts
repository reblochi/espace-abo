// API Admin - Liste des PSP disponibles

import { NextResponse } from 'next/server';
import { requireAdminOrAgent } from '@/lib/admin-auth';
import { getAvailablePSPs } from '@/lib/psp';

const PSP_LABELS: Record<string, string> = {
  stripe: 'Stripe',
  hipay: 'HiPay',
  fenige: 'Fenige PayTool',
  payzen: 'PayZen',
  mangopay: 'Mangopay',
};

export async function GET() {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const available = getAvailablePSPs();
  const items = available.map((provider) => ({
    value: provider,
    label: PSP_LABELS[provider] || provider,
  }));

  return NextResponse.json({ items });
}
