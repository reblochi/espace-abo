// API Admin - Detail abonnement

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const { id } = await params;

  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      deadlines: {
        orderBy: { deadlineNumber: 'desc' },
        include: { invoice: { select: { id: true, number: true } } },
      },
    },
  });

  if (!subscription) {
    return NextResponse.json({ error: 'Abonnement non trouve' }, { status: 404 });
  }

  return NextResponse.json(subscription);
}
