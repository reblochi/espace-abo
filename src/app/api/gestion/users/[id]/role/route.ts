// API Admin - Changer le role d'un utilisateur (admin seulement)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, logAdminAction } from '@/lib/admin-auth';
import { z } from 'zod';

const changeRoleSchema = z.object({
  role: z.enum(['USER', 'AGENT', 'ADMIN']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const { id } = await params;

  // Empecher de changer son propre role
  if (id === session.user.id) {
    return NextResponse.json({ error: 'Impossible de modifier votre propre role' }, { status: 400 });
  }

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Body invalide' }, { status: 400 }); }

  const parsed = changeRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Role invalide', details: parsed.error.flatten() }, { status: 400 });
  }

  const { role } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, email: true } });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
  }

  if (user.role === role) {
    return NextResponse.json({ message: 'Role inchange' });
  }

  await prisma.user.update({
    where: { id },
    data: { role },
  });

  await logAdminAction(
    session.user.id,
    'change_role',
    'User',
    id,
    { from: user.role, to: role, email: user.email }
  );

  return NextResponse.json({ success: true, role });
}
