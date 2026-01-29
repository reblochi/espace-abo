// API Route - Verification paiement Checkout et finalisation demarche

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { createAdvercityProcess, mapProcessTypeToAdvercity, mapProcessDataToAdvercity } from '@/lib/advercity';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// GET /api/processes/verify - Verifier session Checkout et finaliser la demarche
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID requis' }, { status: 400 });
    }

    // Recuperer la session Checkout
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    // Verifier que c'est bien l'utilisateur
    if (checkoutSession.metadata?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Session non autorisee' }, { status: 403 });
    }

    // Verifier le statut du paiement
    if (checkoutSession.payment_status !== 'paid') {
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

    // Si deja paye, retourner
    if (demarche.status !== 'PENDING_PAYMENT') {
      return NextResponse.json({ process: demarche });
    }

    // Mettre a jour le statut
    const updatedProcess = await prisma.process.update({
      where: { id: processId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        pspPaymentId: checkoutSession.payment_intent as string,
      },
    });

    // Envoyer vers Advercity
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const advercityData = mapProcessDataToAdvercity(
        demarche.type,
        demarche.data as Record<string, unknown>,
        {
          email: demarche.user.email,
          firstName: demarche.user.firstName,
          lastName: demarche.user.lastName,
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
          lastSyncAt: new Date(),
        },
      });
    } catch (advercityError) {
      console.error('Erreur envoi Advercity:', advercityError);
      // Le process reste en PAID pour retry ulterieur
    }

    // Envoyer email de confirmation
    await sendEmail({
      to: demarche.user.email,
      subject: `Confirmation de votre demarche ${demarche.reference}`,
      template: 'process-confirmation',
      data: {
        firstName: demarche.user.firstName,
        reference: demarche.reference,
        type: demarche.type,
        isFromSubscription: false,
        amount: `${(demarche.amountCents / 100).toFixed(2).replace('.', ',')} EUR`,
      },
    });

    return NextResponse.json({ process: updatedProcess });
  } catch (error) {
    console.error('Erreur verification paiement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la verification' },
      { status: 500 }
    );
  }
}
