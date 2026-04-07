// API Route - Demarches

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { paginationSchema } from '@/schemas';
import { generateReference } from '@/lib/utils';
import {
  createAdvercityProcess,
  mapProcessTypeToAdvercity,
  mapProcessDataToAdvercity,
} from '@/lib/advercity';
import { sendEmail } from '@/lib/email';
import {
  PROCESS_TYPES_CONFIG,
  getRequiredDocuments,
  type ProcessTypeConfig,
} from '@/lib/process-types';
import { calculateRegistrationTaxes } from '@/lib/taxes/registration-certificate';
import { checkProcessEligibility } from '@/lib/subscription/process-eligibility';
import type { ProcessStatus, ProcessType } from '@prisma/client';
import { z } from 'zod';

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

// Schema de creation flexible pour tous types de demarches
const createProcessRequestSchema = z.object({
  type: z.string(),
  data: z.record(z.unknown()),
  isFromSubscription: z.boolean().default(false),
  asDraft: z.boolean().default(false), // Permet de creer un brouillon
  stampTaxCents: z.number().int().min(0).default(0), // Timbre fiscal (vol/perte CNI)
  partner: z.string().optional(),
  pricingCode: z.string().optional(),
  source: z.string().optional(),
});

// POST /api/processes - Creer une demarche (brouillon ou directe)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json();
    const result = createProcessRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation echouee', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { type, data, isFromSubscription, asDraft, stampTaxCents, partner, pricingCode, source } = result.data;

    // Verifier que le type existe
    const processConfig = PROCESS_TYPES_CONFIG[type as ProcessType];
    if (!processConfig) {
      return NextResponse.json(
        { error: 'Type de demarche invalide' },
        { status: 400 }
      );
    }

    // Recuperer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    // Si via abonnement, verifier l'eligibilite
    let eligibility = null;
    if (isFromSubscription) {
      eligibility = await checkProcessEligibility(session.user.id, type as ProcessType);

      if (!eligibility.eligible) {
        return NextResponse.json(
          {
            error: 'Non eligible pour cette demarche via abonnement',
            reason: eligibility.reason,
          },
          { status: 400 }
        );
      }
    }

    // Generer reference
    const count = await prisma.process.count();
    const reference = generateReference('DEM', count + 1);

    // Calculer le prix
    let amountCents = processConfig.basePrice;
    let taxesCents = 0;
    let serviceFeesCents = processConfig.basePrice;

    // Pour la carte grise, calculer les taxes
    if (type === 'REGISTRATION_CERT' && data.vehicle && data.holder) {
      const vehicleData = data.vehicle as {
        fiscalPower: number;
        co2?: number;
        energyId: number;
        state: number;
        registrationNumber: string;
        registrationDate: string;
        make: string;
        model: string;
        typeId: number;
      };
      const holderData = data.holder as { departmentCode: string };

      const taxes = calculateRegistrationTaxes(
        {
          vehicle: vehicleData,
          departmentCode: holderData.departmentCode,
        },
        isFromSubscription ? 0 : processConfig.basePrice
      );

      taxesCents = taxes.taxeRegionale + taxes.taxeGestion + taxes.taxeAcheminement + taxes.malus;
      serviceFeesCents = taxes.serviceFee;
      amountCents = taxes.total;
    }

    // Ajouter le timbre fiscal (CNI vol/perte)
    if (stampTaxCents > 0) {
      taxesCents += stampTaxCents;
      amountCents += stampTaxCents;
    }

    // Si abonnement, frais de service = 0
    if (isFromSubscription) {
      serviceFeesCents = 0;
      amountCents = taxesCents; // Seulement les taxes obligatoires (inclut timbre fiscal)
    }

    // Determiner les documents obligatoires
    const requiredDocs = getRequiredDocuments(type as ProcessType, data as Record<string, unknown>);
    const mandatoryFileTypes = requiredDocs
      .filter(d => d.required)
      .map(d => d.id);

    // Determiner le statut initial
    let initialStatus: ProcessStatus = 'DRAFT';
    if (!asDraft) {
      if (mandatoryFileTypes.length > 0) {
        initialStatus = 'PENDING_DOCUMENTS';
      } else if (isFromSubscription) {
        initialStatus = 'PAID';
      } else {
        initialStatus = 'PENDING_PAYMENT';
      }
    }

    // Creer en BDD
    const newProcess = await prisma.process.create({
      data: {
        reference,
        userId: session.user.id,
        type: type as ProcessType,
        status: initialStatus,
        amountCents,
        taxesCents,
        serviceFeesCents,
        isFromSubscription,
        data,
        mandatoryFileTypes,
        partner: partner ?? null,
        pricingCode: pricingCode ?? null,
        source: source ?? null,
      },
    });

    // Creer l'historique de statut initial
    await prisma.processStatusHistory.create({
      data: {
        processId: newProcess.id,
        fromStatus: 'DRAFT',
        toStatus: initialStatus,
        reason: asDraft ? 'Creation du brouillon' : 'Creation de la demarche',
        createdBy: session.user.id,
      },
    });

    // Si deja paye (abonnement sans documents requis), envoyer a Advercity
    if (initialStatus === 'PAID' && isFromSubscription) {
      // Consommer un usage
      const { consumeSubscriptionProcess } = await import('@/lib/subscription/process-eligibility');
      await consumeSubscriptionProcess(
        eligibility!.subscriptionId!,
        newProcess.id,
        type as ProcessType
      );

      try {
        const advercityResponse = await createAdvercityProcess({
          type: mapProcessTypeToAdvercity(type),
          external_reference: reference,
          webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/advercity/webhook`,
          data: mapProcessDataToAdvercity(type, data as Record<string, unknown>, {
            email: (data as Record<string, unknown>).email as string || user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: (data as Record<string, unknown>).telephone as string || undefined,
          }),
        });

        await prisma.processStatusHistory.create({
          data: {
            processId: newProcess.id,
            fromStatus: 'PAID',
            toStatus: 'SENT_TO_ADVERCITY',
            reason: 'Envoi automatique vers le back-office',
            metadata: {
              advercityId: advercityResponse.advercity_id,
              advercityRef: advercityResponse.advercity_reference,
            },
            createdBy: 'system',
          },
        });

        await prisma.process.update({
          where: { id: newProcess.id },
          data: {
            status: 'SENT_TO_ADVERCITY',
            advercityId: advercityResponse.advercity_id,
            advercityRef: advercityResponse.advercity_reference,
            paidAt: new Date(),
            submittedAt: new Date(),
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

    // Recuperer le process mis a jour
    const finalProcess = await prisma.process.findUnique({
      where: { id: newProcess.id },
    });

    return NextResponse.json({
      process: finalProcess,
      requiredDocuments: mandatoryFileTypes,
      taxes: type === 'REGISTRATION_CERT' ? {
        amount: taxesCents,
        serviceFee: serviceFeesCents,
        total: amountCents,
      } : null,
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur creation demarche:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la demarche' },
      { status: 500 }
    );
  }
}
