// API Route - Demarches

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { createProcessSchema, paginationSchema } from '@/schemas';
import { generateReference } from '@/lib/utils';
import {
  createAdvercityProcess,
  mapProcessTypeToAdvercity,
  mapProcessDataToAdvercity,
} from '@/lib/advercity';
import { sendEmail } from '@/lib/email';
import type { ProcessStatus } from '@prisma/client';

// GET /api/processes - Liste des demarches
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;

    const where = {
      userId: session.user.id,
      ...(status && { status: status as ProcessStatus }),
    };

    const [processes, total] = await Promise.all([
      prisma.process.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { files: { where: { deleted: false } } },
          },
        },
      }),
      prisma.process.count({ where }),
    ]);

    return NextResponse.json({
      processes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur liste demarches:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des demarches' },
      { status: 500 }
    );
  }
}

// POST /api/processes - Creer une demarche
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json();
    const result = createProcessSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation echouee', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { type, data, isFromSubscription } = result.data;

    // Recuperer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    // Si via abonnement, verifier qu'il est actif
    if (isFromSubscription) {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
      });

      const isActive = subscription && (
        subscription.status === 'ACTIVE' ||
        (subscription.status === 'CANCELED' &&
         subscription.endDate &&
         subscription.endDate > new Date())
      );

      if (!isActive) {
        return NextResponse.json(
          { error: 'Abonnement non actif' },
          { status: 400 }
        );
      }
    }

    // Generer reference
    const count = await prisma.process.count();
    const reference = generateReference('DEM', count + 1);

    // Prix selon type et abonnement
    const amountCents = isFromSubscription ? 0 : 2990; // 29.90 EUR

    // Determiner les fichiers obligatoires selon le type
    const mandatoryFileTypes = getMandatoryFileTypes(type);

    // Creer en BDD
    const newProcess = await prisma.process.create({
      data: {
        reference,
        userId: session.user.id,
        type,
        status: isFromSubscription ? 'PAID' : 'PENDING_PAYMENT',
        amountCents,
        isFromSubscription,
        data,
        paidAt: isFromSubscription ? new Date() : null,
        mandatoryFileTypes,
      },
    });

    // Si deja paye (abonnement), envoyer a Advercity
    if (isFromSubscription) {
      try {
        const advercityResponse = await createAdvercityProcess({
          type: mapProcessTypeToAdvercity(type),
          external_reference: reference,
          webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/advercity/webhook`,
          data: mapProcessDataToAdvercity(type, data, {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          }),
        });

        await prisma.process.update({
          where: { id: newProcess.id },
          data: {
            status: 'SENT_TO_ADVERCITY',
            advercityId: advercityResponse.advercity_id,
            advercityRef: advercityResponse.advercity_reference,
            lastSyncAt: new Date(),
          },
        });
      } catch (advError) {
        console.error('Erreur envoi Advercity:', advError);
        // La demarche reste en PAID pour retry ulterieur
      }

      // Email de confirmation
      await sendEmail({
        to: user.email,
        subject: `Confirmation de votre demarche ${reference}`,
        template: 'process-confirmation',
        data: {
          firstName: user.firstName,
          reference,
          type,
          isFromSubscription: true,
        },
      });
    }

    return NextResponse.json({ process: newProcess }, { status: 201 });
  } catch (error) {
    console.error('Erreur creation demarche:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la demarche' },
      { status: 500 }
    );
  }
}

// Helper pour determiner les fichiers obligatoires
function getMandatoryFileTypes(type: string): string[] {
  const mapping: Record<string, string[]> = {
    CIVIL_STATUS_BIRTH: ['CNI'],
    CIVIL_STATUS_MARRIAGE: ['CNI'],
    CIVIL_STATUS_DEATH: ['CNI', 'ACTE_NAISSANCE'],
    CRIMINAL_RECORD: ['CNI'],
    PASSPORT: ['CNI', 'PHOTO_IDENTITE', 'JUSTIFICATIF_DOMICILE'],
    IDENTITY_CARD: ['PHOTO_IDENTITE', 'JUSTIFICATIF_DOMICILE'],
  };
  return mapping[type] || [];
}
