// API Admin - Detail et mise a jour litige

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, logAdminAction } from '@/lib/admin-auth';
import { adminUpdateDisputeSchema } from '@/schemas/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const { id } = await params;

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    include: {
      creditNote: { select: { id: true, number: true, totalCents: true } },
    },
  });

  if (!dispute) {
    return NextResponse.json({ error: 'Litige non trouve' }, { status: 404 });
  }

  return NextResponse.json(dispute);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const { id } = await params;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Body invalide' }, { status: 400 }); }
  const parsed = adminUpdateDisputeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Donnees invalides', details: parsed.error.flatten() }, { status: 400 });
  }

  const dispute = await prisma.dispute.update({
    where: { id },
    data: { adminNotes: parsed.data.adminNotes },
  });

  await logAdminAction(session.user.id, 'update_dispute_notes', 'Dispute', id);

  return NextResponse.json(dispute);
}
