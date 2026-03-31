// API Admin - Detail facture

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

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, address: true, zipCode: true, city: true } },
      process: { select: { id: true, reference: true, type: true, status: true } },
      deadline: { select: { id: true, deadlineNumber: true, subscriptionId: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Facture non trouvee' }, { status: 404 });
  }

  return NextResponse.json(invoice);
}
