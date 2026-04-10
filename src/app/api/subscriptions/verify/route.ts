// API Route - Verification session Checkout et finalisation abonnement

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { generateReference } from '@/lib/utils';
import { updateConsentStrongAuth } from '@/lib/consent';
import { getDefaultPSPAdapter } from '@/lib/psp';

// GET /api/subscriptions/verify - Verifier session Checkout
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

    // Recuperer la session Checkout via l'adapter PSP
    const psp = getDefaultPSPAdapter();
    const checkoutSession = await psp.retrieveCheckoutSession(sessionId, true);

    // Verifier que c'est bien l'utilisateur
    if (checkoutSession.metadata?.userId !== session.user.id) {
      return NextResponse.json({ error: 'Session non autorisee' }, { status: 403 });
    }

    // Verifier le statut
    if (checkoutSession.paymentStatus !== 'paid') {
      return NextResponse.json({ error: 'Paiement non confirme' }, { status: 400 });
    }

    // Enrichir le consentement avec le resultat 3DS
    const consentId = checkoutSession.metadata?.consentId;
    if (consentId && checkoutSession.subscription?.latestInvoiceId) {
      try {
        const authDetails = await psp.getInvoiceAuthDetails(checkoutSession.subscription.latestInvoiceId);
        if (authDetails.threeDsResult) {
          await updateConsentStrongAuth(consentId, `3ds_${authDetails.threeDsResult}`);
        }
      } catch (err) {
        console.error('[Verify] Erreur enrichissement 3DS consent:', err);
      }
    }

    // Verifier que les donnees de subscription sont presentes
    if (!checkoutSession.subscription || !checkoutSession.customerId || !checkoutSession.subscriptionId) {
      return NextResponse.json({ error: 'Donnees abonnement manquantes' }, { status: 400 });
    }

    // Verifier si l'abonnement existe deja
    let subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      // Generer reference unique
      const count = await prisma.subscription.count();
      const reference = generateReference('SUB', count + 1);

      // Creer l'abonnement
      subscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          reference,
          status: 'ACTIVE',
          amountCents: 990,
          currentPeriodStart: checkoutSession.subscription.currentPeriodStart,
          currentPeriodEnd: checkoutSession.subscription.currentPeriodEnd,
          pspProvider: checkoutSession.provider,
          pspCustomerId: checkoutSession.customerId,
          pspSubscriptionId: checkoutSession.subscriptionId,
        },
      });

      // Creer la premiere echeance
      await prisma.subscriptionDeadline.create({
        data: {
          subscriptionId: subscription.id,
          deadlineNumber: 1,
          amountCents: subscription.amountCents,
          dueDate: new Date(),
          status: 'PERFORMED',
          paymentStatus: 'PAID',
          paidAt: new Date(),
        },
      });

      // Recuperer l'utilisateur pour l'email
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });

      // Envoyer email de confirmation
      if (user) {
        await sendEmail({
          to: user.email,
          subject: `Confirmation de votre abonnement ${subscription.reference}`,
          template: 'subscription-confirmation',
          data: {
            firstName: user.firstName,
            reference: subscription.reference,
            amount: `${(subscription.amountCents / 100).toFixed(2).replace('.', ',')} EUR`,
            nextBillingDate: checkoutSession.subscription.currentPeriodEnd.toLocaleDateString('fr-FR'),
          },
        });
      }
    } else if (subscription.status !== 'ACTIVE') {
      // Mettre a jour un abonnement existant
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          currentPeriodStart: checkoutSession.subscription.currentPeriodStart,
          currentPeriodEnd: checkoutSession.subscription.currentPeriodEnd,
          pspSubscriptionId: checkoutSession.subscriptionId,
          pspCustomerId: checkoutSession.customerId,
        },
      });
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Erreur verification session:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la verification' },
      { status: 500 }
    );
  }
}
