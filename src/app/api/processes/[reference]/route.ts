// API Route - Detail demarche

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { processStatusLabels } from '@/types';

// GET /api/processes/:reference - Detail d'une demarche
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const process = await prisma.process.findFirst({
      where: {
        reference,
        userId: session.user.id,
      },
      include: {
        files: {
          where: { deleted: false },
          orderBy: { createdAt: 'desc' },
        },
        invoice: {
          select: {
            id: true,
            number: true,
            totalCents: true,
            status: true,
          },
        },
      },
    });

    if (!process) {
      return NextResponse.json({ error: 'Demarche non trouvee' }, { status: 404 });
    }

    // Construire la timeline
    const timeline = buildProcessTimeline(process);

    return NextResponse.json({
      ...process,
      statusLabel: processStatusLabels[process.status as keyof typeof processStatusLabels] || process.status,
      timeline,
    });
  } catch (error) {
    console.error('Erreur detail demarche:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement de la demarche' },
      { status: 500 }
    );
  }
}

// Helper pour construire la timeline
function buildProcessTimeline(process: { status: string; createdAt: Date; paidAt: Date | null; advercityStatus: number | null }) {
  const steps = [
    {
      step: 'CREATED',
      label: 'Demande creee',
      completed: true,
      date: process.createdAt.toISOString(),
    },
    {
      step: 'PAID',
      label: 'Paiement recu',
      completed: ['PAID', 'SENT_TO_ADVERCITY', 'IN_PROGRESS', 'COMPLETED'].includes(process.status),
      date: process.paidAt?.toISOString(),
    },
    {
      step: 'SENT',
      label: 'Envoyee a la mairie',
      completed: ['SENT_TO_ADVERCITY', 'IN_PROGRESS', 'COMPLETED'].includes(process.status),
    },
    {
      step: 'IN_PROGRESS',
      label: 'En traitement',
      completed: ['IN_PROGRESS', 'COMPLETED'].includes(process.status),
    },
    {
      step: 'COMPLETED',
      label: 'Terminee',
      completed: process.status === 'COMPLETED',
    },
  ];

  // Mapping step Advercity vers nos etapes
  if (process.advercityStatus !== null) {
    const advercityStepMapping: Record<number, string> = {
      2: 'PAID',
      3: 'IN_PROGRESS',
      4: 'COMPLETED',
      5: 'COMPLETED',
      6: 'COMPLETED',
    };
    const advStep = advercityStepMapping[process.advercityStatus];
    if (advStep) {
      const stepIndex = steps.findIndex(s => s.step === advStep);
      if (stepIndex >= 0) {
        for (let i = 0; i <= stepIndex; i++) {
          steps[i].completed = true;
        }
      }
    }
  }

  return steps;
}
