// API Route - Profil utilisateur

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { profileSchema } from '@/schemas';

// GET /api/profile - Recuperer le profil
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        birthDate: true,
        birthCountryId: true,
        birthCityId: true,
        birthCityName: true,
        address: true,
        addressExtra: true,
        zipCode: true,
        city: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erreur recuperation profil:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du profil' },
      { status: 500 }
    );
  }
}

// PATCH /api/profile - Mettre a jour le profil
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json();
    const result = profileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation echouee', details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Convertir birthDate string en DateTime si present
    const updateData: Record<string, unknown> = { ...result.data };
    if (typeof updateData.birthDate === 'string' && updateData.birthDate) {
      updateData.birthDate = new Date(updateData.birthDate);
    } else if (updateData.birthDate === '' || updateData.birthDate === null) {
      updateData.birthDate = null;
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        birthDate: true,
        birthCountryId: true,
        birthCityId: true,
        birthCityName: true,
        address: true,
        addressExtra: true,
        zipCode: true,
        city: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erreur mise a jour profil:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise a jour' },
      { status: 500 }
    );
  }
}
