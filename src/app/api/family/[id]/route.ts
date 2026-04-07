// API Route - Membre famille individuel

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { familyMemberSchema } from '@/schemas';

// PATCH /api/family/:id - Modifier un membre
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { id } = await params;

    // Verifier que le membre appartient au user
    const existing = await prisma.familyMember.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Membre non trouve' }, { status: 404 });
    }

    const body = await request.json();
    const result = familyMemberSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation echouee', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = { ...result.data };
    if (typeof data.birthDate === 'string' && data.birthDate) {
      data.birthDate = new Date(data.birthDate);
    } else if (data.birthDate === '' || data.birthDate === null) {
      data.birthDate = null;
    }
    if (data.email === '') data.email = null;

    const member = await prisma.familyMember.update({
      where: { id },
      data,
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Erreur mise a jour membre:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/family/:id - Supprimer un membre
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.familyMember.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Membre non trouve' }, { status: 404 });
    }

    await prisma.familyMember.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression membre:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
