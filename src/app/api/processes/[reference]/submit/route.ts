// API Route - Soumission d'une demarche (passage de DRAFT/PENDING_DOCUMENTS vers paiement)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getRequiredDocuments } from '@/lib/process-types';
import type { ProcessType, FileType } from '@/types';

// POST /api/processes/:reference/submit - Soumettre une demarche
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // Recuperer la demarche
    const demarche = await prisma.process.findFirst({
      where: {
        reference,
        userId: session.user.id,
      },
      include: {
        files: {
          where: { deleted: false },
        },
      },
    });

    if (!demarche) {
      return NextResponse.json({ error: 'Demarche non trouvee' }, { status: 404 });
    }

    // Verifier le statut
    if (!['DRAFT', 'PENDING_DOCUMENTS'].includes(demarche.status)) {
      return NextResponse.json(
        { error: 'Demarche ne peut pas etre soumise (statut: ' + demarche.status + ')' },
        { status: 400 }
      );
    }

    // Recuperer les documents requis
    const requiredDocs = getRequiredDocuments(
      demarche.type as ProcessType,
      demarche.data as Record<string, unknown>
    );

    // Verifier que tous les documents obligatoires sont presents
    const uploadedTypes = new Set(demarche.files.map(f => f.fileType));
    const missingDocs = requiredDocs.filter(
      doc => doc.required && !uploadedTypes.has(doc.id as FileType)
    );

    if (missingDocs.length > 0) {
      return NextResponse.json(
        {
          error: 'Documents manquants',
          missingDocuments: missingDocs.map(d => ({
            id: d.id,
            label: d.label,
          })),
        },
        { status: 400 }
      );
    }

    // Si c'est une demarche via abonnement, verifier l'eligibilite
    if (demarche.isFromSubscription) {
      const { checkProcessEligibility, consumeSubscriptionProcess } = await import(
        '@/lib/subscription/process-eligibility'
      );
      const eligibility = await checkProcessEligibility(session.user.id, demarche.type as ProcessType);

      if (!eligibility.eligible) {
        return NextResponse.json(
          {
            error: 'Non eligible pour cette demarche via abonnement',
            reason: eligibility.reason,
          },
          { status: 400 }
        );
      }

      // Consommer un usage de l'abonnement
      await consumeSubscriptionProcess(
        eligibility.subscriptionId!,
        demarche.id,
        demarche.type as ProcessType
      );

      // Marquer comme paye et envoyer a Advercity
      const { createAdvercityProcess, mapProcessTypeToAdvercity, mapProcessDataToAdvercity } =
        await import('@/lib/advercity');
      const { sendEmail } = await import('@/lib/email');

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user) {
        return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
      }

      // Creer l'historique de statut
      await prisma.processStatusHistory.create({
        data: {
          processId: demarche.id,
          fromStatus: demarche.status,
          toStatus: 'PAID',
          reason: 'Demarche incluse dans l\'abonnement',
          createdBy: session.user.id,
        },
      });

      // Mettre a jour le statut
      let updatedProcess = await prisma.process.update({
        where: { id: demarche.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          submittedAt: new Date(),
        },
      });

      // Envoyer a Advercity
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const formData = demarche.data as Record<string, unknown>;
        const advercityData = mapProcessDataToAdvercity(
          demarche.type,
          formData,
          {
            email: (formData.email as string) || user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: (formData.telephone as string) || undefined,
          }
        );

        const advercityResult = await createAdvercityProcess({
          type: mapProcessTypeToAdvercity(demarche.type),
          external_reference: demarche.reference,
          webhook_url: `${baseUrl}/api/advercity/webhook`,
          data: advercityData,
        });

        // Historique envoi Advercity
        await prisma.processStatusHistory.create({
          data: {
            processId: demarche.id,
            fromStatus: 'PAID',
            toStatus: 'SENT_TO_ADVERCITY',
            reason: 'Envoi automatique vers le back-office',
            metadata: {
              advercityId: advercityResult.advercity_id,
              advercityRef: advercityResult.advercity_reference,
            },
            createdBy: 'system',
          },
        });

        updatedProcess = await prisma.process.update({
          where: { id: demarche.id },
          data: {
            status: 'SENT_TO_ADVERCITY',
            advercityId: advercityResult.advercity_id,
            advercityRef: advercityResult.advercity_reference,
            lastSyncAt: new Date(),
          },
        });

        if (advercityResult.advercity_customer_id && !user.advercityCustomerId) {
          await prisma.user.update({
            where: { id: user.id },
            data: { advercityCustomerId: advercityResult.advercity_customer_id },
          });
        }
      } catch (advError) {
        console.error('Erreur envoi Advercity:', advError);
        // Le process reste en PAID pour retry ulterieur
      }

      // Email de confirmation
      await sendEmail({
        to: user.email,
        subject: `Confirmation de votre demarche ${demarche.reference}`,
        template: 'process-confirmation',
        data: {
          firstName: user.firstName,
          reference: demarche.reference,
          type: demarche.type,
          isFromSubscription: true,
        },
      });

      return NextResponse.json({
        process: updatedProcess,
        message: 'Demarche soumise avec succes (incluse dans l\'abonnement)',
      });
    }

    // Sinon, passer en PENDING_PAYMENT
    await prisma.processStatusHistory.create({
      data: {
        processId: demarche.id,
        fromStatus: demarche.status,
        toStatus: 'PENDING_PAYMENT',
        reason: 'Demarche soumise, en attente de paiement',
        createdBy: session.user.id,
      },
    });

    const updatedProcess = await prisma.process.update({
      where: { id: demarche.id },
      data: {
        status: 'PENDING_PAYMENT',
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      process: updatedProcess,
      message: 'Demarche soumise, en attente de paiement',
      requiresPayment: true,
    });
  } catch (error) {
    console.error('Erreur soumission demarche:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la soumission de la demarche' },
      { status: 500 }
    );
  }
}
