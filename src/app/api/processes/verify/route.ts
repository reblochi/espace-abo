// API Route - Verification paiement Checkout et finalisation demarche

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { createAdvercityProcess, mapProcessTypeToAdvercity, mapProcessDataToAdvercity } from '@/lib/advercity';
import { generateAutoLoginToken } from '@/lib/auto-login';
import { getDefaultPSPAdapter } from '@/lib/psp';

// GET /api/processes/verify - Verifier session Checkout et finaliser la demarche
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID requis' }, { status: 400 });
    }

    // Recuperer la session Checkout via l'adapter PSP
    const psp = getDefaultPSPAdapter();
    const checkoutSession = await psp.retrieveCheckoutSession(sessionId);

    // Verifier l'identite : soit via session NextAuth, soit via metadata Stripe (embed/public)
    const stripeUserId = checkoutSession.metadata?.userId;
    if (session?.user?.id) {
      // Utilisateur connecte : verifier que c'est bien lui
      if (stripeUserId !== session.user.id) {
        return NextResponse.json({ error: 'Session non autorisee' }, { status: 403 });
      }
    } else if (!stripeUserId) {
      // Ni connecte ni userId dans metadata : impossible de verifier
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // Verifier le statut du paiement
    if (checkoutSession.paymentStatus !== 'paid') {
      return NextResponse.json({ error: 'Paiement non confirme' }, { status: 400 });
    }

    const processId = checkoutSession.metadata?.processId;
    if (!processId) {
      return NextResponse.json({ error: 'Process non trouve' }, { status: 400 });
    }

    // Recuperer le process
    const demarche = await prisma.process.findUnique({
      where: { id: processId },
      include: { user: true },
    });

    if (!demarche) {
      return NextResponse.json({ error: 'Process non trouve' }, { status: 404 });
    }

    // Si deja paye, retourner (le webhook a deja traite)
    if (demarche.status !== 'PENDING_PAYMENT') {
      return NextResponse.json({ process: demarche });
    }

    // Determiner si c'est un mode subscription
    const isSubscriptionMode = checkoutSession.mode === 'subscription';
    const subscriptionId = checkoutSession.subscriptionId || null;
    const customerId = checkoutSession.customerId || null;

    // Mettre a jour le statut du process
    const updatedProcess = await prisma.process.update({
      where: { id: processId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        pspPaymentId: checkoutSession.paymentIntentId || '',
        isFromSubscription: isSubscriptionMode,
        ...(isSubscriptionMode ? { serviceFeesCents: 0, amountCents: demarche.taxesCents } : {}),
      },
    });

    // Creer l'historique de statut
    await prisma.processStatusHistory.create({
      data: {
        processId,
        fromStatus: 'PENDING_PAYMENT',
        toStatus: 'PAID',
        reason: isSubscriptionMode
          ? 'Paiement valide via abonnement (verification)'
          : 'Paiement valide via Stripe Checkout (verification)',
        createdBy: 'system',
      },
    });

    // Si mode subscription, creer l'abonnement en BDD si pas deja fait
    if (isSubscriptionMode && subscriptionId && customerId) {
      const existingSub = await prisma.subscription.findFirst({
        where: { pspSubscriptionId: subscriptionId },
      });

      if (!existingSub) {
        const { generateReference } = await import('@/lib/utils');
        const count = await prisma.subscription.count();
        const subReference = generateReference('SUB', count + 1);
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        await prisma.subscription.create({
          data: {
            reference: subReference,
            userId: stripeUserId!,
            status: 'ACTIVE',
            amountCents: 990,
            currency: 'EUR',
            pspProvider: 'stripe',
            pspSubscriptionId: subscriptionId,
            pspCustomerId: customerId,
            startDate: now,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        });
      }
    }

    // Envoyer vers Advercity
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      // Utiliser les coordonnees du formulaire si disponibles, sinon celles du user
      const formData = demarche.data as Record<string, unknown>;
      const advercityData = mapProcessDataToAdvercity(
        demarche.type,
        formData,
        {
          email: (formData.email as string) || demarche.user.email,
          firstName: demarche.user.firstName,
          lastName: demarche.user.lastName,
          phone: (formData.telephone as string) || undefined,
        }
      );

      const advercityResult = await createAdvercityProcess({
        type: mapProcessTypeToAdvercity(demarche.type),
        external_reference: demarche.reference,
        webhook_url: `${baseUrl}/api/advercity/webhook`,
        data: advercityData,
      });

      await prisma.process.update({
        where: { id: processId },
        data: {
          status: 'SENT_TO_ADVERCITY',
          advercityId: advercityResult.advercity_id,
          advercityRef: advercityResult.advercity_reference,
          submittedAt: new Date(),
          lastSyncAt: new Date(),
        },
      });

      await prisma.processStatusHistory.create({
        data: {
          processId,
          fromStatus: 'PAID',
          toStatus: 'SENT_TO_ADVERCITY',
          reason: 'Envoi automatique vers le back-office (verification)',
          metadata: {
            advercityId: advercityResult.advercity_id,
            advercityRef: advercityResult.advercity_reference,
          },
          createdBy: 'system',
        },
      });
    } catch (advercityError) {
      console.error('Erreur envoi Advercity:', advercityError);
      // Le process reste en PAID pour retry ulterieur
    }

    // Envoyer email de confirmation (non-bloquant)
    sendEmail({
      to: demarche.user.email,
      subject: `Confirmation de votre demarche ${demarche.reference}`,
      template: 'process-confirmation',
      data: {
        firstName: demarche.user.firstName,
        reference: demarche.reference,
        type: demarche.type,
        isFromSubscription: isSubscriptionMode,
        amount: isSubscriptionMode ? undefined : `${(demarche.amountCents / 100).toFixed(2).replace('.', ',')} EUR`,
      },
    }).catch((err) => console.error('Erreur envoi email confirmation:', err));

    // Generer un token d'auto-login si l'utilisateur n'est pas connecte
    let autoLoginToken: string | null = null;
    if (!session?.user?.id && stripeUserId) {
      autoLoginToken = generateAutoLoginToken(stripeUserId);
    }

    return NextResponse.json({ process: updatedProcess, autoLoginToken });
  } catch (error) {
    console.error('Erreur verification paiement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la verification' },
      { status: 500 }
    );
  }
}
