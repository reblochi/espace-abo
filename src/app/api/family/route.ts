// API Route - Membres de la famille

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { familyMemberSchema } from '@/schemas';

// GET /api/family - Liste des membres
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const members = await prisma.familyMember.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Erreur chargement famille:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/family - Ajouter un membre
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json();
    const result = familyMemberSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation echouee', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = { ...result.data, userId: session.user.id };
    if (typeof data.birthDate === 'string' && data.birthDate) {
      data.birthDate = new Date(data.birthDate);
    } else if (data.birthDate === '' || data.birthDate === null) {
      data.birthDate = null;
    }
    // Nettoyer email vide
    if (data.email === '') data.email = null;

    const member = await prisma.familyMember.create({ data });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Erreur creation membre:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
