// API Admin - Fiche utilisateur complete

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdminOrAgent } from '@/lib/admin-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      reference: true,
      email: true,
      firstName: true,
      lastName: true,
      gender: true,
      phone: true,
      birthDate: true,
      address: true,
      addressExtra: true,
      zipCode: true,
      city: true,
      country: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      subscription: {
        include: {
          deadlines: {
            orderBy: { deadlineNumber: 'desc' },
            include: { invoice: true },
          },
        },
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      processes: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          reference: true,
          type: true,
          status: true,
          amountCents: true,
          isFromSubscription: true,
          createdAt: true,
          paidAt: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
  }

  // Charger les litiges lies
  const disputeFilters = [];
  if (user.subscription?.id) {
    disputeFilters.push({ subscriptionId: user.subscription.id });
  }
  if (user.processes.length > 0) {
    disputeFilters.push({ processId: { in: user.processes.map((p: { id: string }) => p.id) } });
  }

  const disputes = disputeFilters.length > 0
    ? await prisma.dispute.findMany({
        where: { OR: disputeFilters },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  // Charger l'historique des actions admin sur ce client
  const auditTargetIds = [id];
  if (user.subscription?.id) auditTargetIds.push(user.subscription.id);
  user.invoices.forEach((inv: { id: string }) => auditTargetIds.push(inv.id));

  const auditLogs = await prisma.adminAuditLog.findMany({
    where: { targetId: { in: auditTargetIds } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ ...user, disputes, auditLogs });
}
