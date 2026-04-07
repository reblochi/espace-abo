// API Publique - Chargement d'un profil de tarification par code

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const HARDCODED_FALLBACK = {
  code: 'default',
  paymentMode: 'both',
  subscriptionMonthlyPrice: 990,
  basePrice: 3990,
};

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim() || 'default';

  // Try the requested code (case-insensitive), active profiles only
  let profile = await prisma.pricingProfile.findFirst({
    where: {
      code: { equals: code, mode: 'insensitive' },
      isActive: true,
    },
  });

  // Fall back to the "default" profile
  if (!profile && code.toLowerCase() !== 'default') {
    profile = await prisma.pricingProfile.findFirst({
      where: {
        code: { equals: 'default', mode: 'insensitive' },
        isActive: true,
      },
    });
  }

  const data = profile ?? HARDCODED_FALLBACK;

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=60',
    },
  });
}
