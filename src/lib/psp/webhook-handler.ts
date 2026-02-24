// Handler unifie pour les webhooks PSP

import type { NextRequest } from 'next/server';
import type { PSPProvider, WebhookEvent } from './types';
import { getPSPAdapter } from './index';
import { prisma } from '../db';
import { sendEmail } from '../email';
import { formatCurrency, generateReference } from '../utils';
import {
  createAdvercityProcess,
  mapProcessTypeToAdvercity,
  mapProcessDataToAdvercity,
} from '../advercity';
import type { ProcessType } from '@prisma/client';

// Handler principal
export async function handlePSPWebhook(
  request: NextRequest,
  provider: PSPProvider
): Promise<{ success: boolean; message: string }> {
  const adapter = getPSPAdapter(provider);

  // Lire le body et la signature
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') ||
                   request.headers.get('x-hipay-signature') ||
                   request.headers.get('x-payzen-signature') ||
                   '';

  // Verifier la signature
  if (!adapter.verifyWebhookSignature(body, signature)) {
    return { success: false, message: 'Signature invalide' };
  }

  // Parser l'evenement
  const event = adapter.parseWebhookEvent(body, signature);

  // Router vers le handler approprie
  switch (event.type) {
    case 'subscription.created':
    case 'subscription.updated':
      await handleSubscriptionUpdate(event);
      break;

    case 'subscription.canceled':
    case 'subscription.deleted':
      await handleSubscriptionCanceled(event);
      break;

    case 'invoice.paid':
      await handleInvoicePaid(event);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event);
      break;

    case 'payment.succeeded':
      await handlePaymentSucceeded(event);
      break;

    case 'checkout.completed':
      await handleCheckoutCompleted(event);
      break;

    case 'payment.refunded':
      await handlePaymentRefunded(event);
      break;

    default:
      console.log(`[Webhook] Event non gere: ${event.type}`);
  }

  return { success: true, message: 'Webhook traite' };
}

// Handlers specifiques
async function handleSubscriptionUpdate(event: WebhookEvent): Promise<void> {
  const { subscriptionId, customerId, status } = event.data;
  if (!subscriptionId) return;

  await prisma.subscription.updateMany({
    where: {
      OR: [
        { pspSubscriptionId: subscriptionId },
        { pspCustomerId: customerId },
      ],
    },
    data: {
      status: mapPSPStatusToSubscriptionStatus(status),
    },
  });
}

async function handleSubscriptionCanceled(event: WebhookEvent): Promise<void> {
  const { subscriptionId, customerId } = event.data;
  if (!subscriptionId) return;

  const subscription = await prisma.subscription.findFirst({
    where: {
      OR: [
        { pspSubscriptionId: subscriptionId },
        { pspCustomerId: customerId },
      ],
    },
    include: { user: true },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
        endDate: subscription.currentPeriodEnd,
      },
    });

    // Email de confirmation
    await sendEmail({
      to: subscription.user.email,
      subject: 'Confirmation d\'annulation',
      template: 'subscription-canceled',
      data: {
        firstName: subscription.user.firstName,
        endDate: subscription.currentPeriodEnd.toLocaleDateString('fr-FR'),
      },
    });
  }
}

async function handleInvoicePaid(event: WebhookEvent): Promise<void> {
  const { subscriptionId, amountCents, invoiceId } = event.data;
  if (!subscriptionId) return;

  const subscription = await prisma.subscription.findFirst({
    where: { pspSubscriptionId: subscriptionId },
    include: {
      user: true,
      deadlines: {
        where: { paymentStatus: 'PENDING' },
        orderBy: { dueDate: 'asc' },
        take: 1,
      },
    },
  });

  if (subscription && subscription.deadlines[0]) {
    const deadline = subscription.deadlines[0];

    // Marquer l'echeance comme payee
    await prisma.subscriptionDeadline.update({
      where: { id: deadline.id },
      data: {
        paymentStatus: 'PAID',
        status: 'PERFORMED',
        paidAt: new Date(),
        pspInvoiceId: invoiceId,
      },
    });

    // Mettre a jour la periode de l'abonnement
    const newPeriodEnd = new Date(subscription.currentPeriodEnd);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: subscription.currentPeriodEnd,
        currentPeriodEnd: newPeriodEnd,
      },
    });

    // Creer la prochaine echeance
    await prisma.subscriptionDeadline.create({
      data: {
        subscriptionId: subscription.id,
        deadlineNumber: deadline.deadlineNumber + 1,
        amountCents: subscription.amountCents,
        dueDate: newPeriodEnd,
      },
    });

    // Creer la facture pour cette echeance (non-bloquant)
    try {
      const { createInvoiceRecord } = await import('@/lib/invoice-creation');
      await createInvoiceRecord({
        userId: subscription.userId,
        type: 'SUBSCRIPTION',
        totalCents: amountCents || subscription.amountCents,
        paidAt: new Date(),
        deadlineId: deadline.id,
      });
    } catch (err) {
      console.error('[Webhook] Erreur creation facture abonnement:', err);
    }
  }
}

async function handlePaymentFailed(event: WebhookEvent): Promise<void> {
  const { subscriptionId, customerId } = event.data;

  const subscription = await prisma.subscription.findFirst({
    where: {
      OR: [
        { pspSubscriptionId: subscriptionId },
        { pspCustomerId: customerId },
      ],
    },
    include: { user: true },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'PAST_DUE' },
    });

    // Email d'alerte paiement echoue
    await sendEmail({
      to: subscription.user.email,
      subject: 'Probleme de paiement sur votre abonnement',
      template: 'subscription-canceled', // TODO: template specifique
      data: {
        firstName: subscription.user.firstName,
        amount: formatCurrency(subscription.amountCents),
      },
    });
  }
}

async function handlePaymentSucceeded(event: WebhookEvent): Promise<void> {
  const { paymentId, externalReference, amountCents } = event.data;
  if (!externalReference) return;

  // Chercher une demarche correspondante
  const process = await prisma.process.findFirst({
    where: { reference: externalReference },
    include: { user: true },
  });

  if (process && process.status === 'PENDING_PAYMENT') {
    await prisma.process.update({
      where: { id: process.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        pspPaymentId: paymentId,
      },
    });

    await prisma.processStatusHistory.create({
      data: {
        processId: process.id,
        fromStatus: 'PENDING_PAYMENT',
        toStatus: 'PAID',
        reason: 'Paiement recu via webhook',
        createdBy: 'system',
      },
    });

    // Envoyer a Advercity
    await sendProcessToAdvercity(process.id);

    // Creer la facture pour cette demarche (non-bloquant)
    try {
      const { createInvoiceRecord } = await import('@/lib/invoice-creation');
      await createInvoiceRecord({
        userId: process.userId,
        type: 'PROCESS',
        totalCents: amountCents || process.amountCents,
        paidAt: new Date(),
        processId: process.id,
      });
    } catch (err) {
      console.error('[Webhook] Erreur creation facture demarche:', err);
    }

    // Email de confirmation
    await sendEmail({
      to: process.user.email,
      subject: `Confirmation de paiement - ${process.reference}`,
      template: 'process-confirmation',
      data: {
        firstName: process.user.firstName,
        reference: process.reference,
        amount: formatCurrency(amountCents || process.amountCents),
        isFromSubscription: false,
      },
    });
  }
}

async function handlePaymentRefunded(event: WebhookEvent): Promise<void> {
  const { paymentId, amountCents } = event.data;
  if (!paymentId) return;

  // Chercher le process associe
  const process = await prisma.process.findFirst({
    where: { pspPaymentId: paymentId },
  });

  if (process) {
    await prisma.process.update({
      where: { id: process.id },
      data: { status: 'REFUNDED' },
    });
  }

  // Chercher l'echeance associee
  const deadline = await prisma.subscriptionDeadline.findFirst({
    where: { pspInvoiceId: paymentId },
  });

  if (deadline) {
    await prisma.subscriptionDeadline.update({
      where: { id: deadline.id },
      data: {
        paymentStatus: 'REFUNDED',
        refundedAt: new Date(),
        refundedAmount: amountCents,
      },
    });
  }
}

// Handler checkout.session.completed (mode subscription ou payment)
async function handleCheckoutCompleted(event: WebhookEvent): Promise<void> {
  const { checkoutMode, subscriptionId, customerId, metadata } = event.data;

  const processReference = metadata?.processReference;
  const userId = metadata?.userId;
  const processType = metadata?.processType;

  if (!processReference || !userId) return;

  // Recuperer la demarche
  const existingProcess = await prisma.process.findFirst({
    where: { reference: processReference, userId },
    include: { user: true },
  });

  if (!existingProcess) return;

  if (checkoutMode === 'subscription' && subscriptionId && customerId) {
    // Creer l'abonnement en BDD
    const count = await prisma.subscription.count();
    const subReference = generateReference('SUB', count + 1);

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = await prisma.subscription.create({
      data: {
        reference: subReference,
        userId,
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

    // Creer la premiere echeance
    await prisma.subscriptionDeadline.create({
      data: {
        subscriptionId: subscription.id,
        deadlineNumber: 1,
        amountCents: 990,
        dueDate: now,
        paymentStatus: 'PAID',
        status: 'PERFORMED',
        paidAt: now,
      },
    });

    // Marquer la demarche comme payee (frais de service = 0 car abonnement)
    await prisma.process.update({
      where: { id: existingProcess.id },
      data: {
        status: 'PAID',
        paidAt: now,
        isFromSubscription: true,
        serviceFeesCents: 0,
        amountCents: existingProcess.taxesCents, // Seulement les taxes
      },
    });

    await prisma.processStatusHistory.create({
      data: {
        processId: existingProcess.id,
        fromStatus: 'PENDING_PAYMENT',
        toStatus: 'PAID',
        reason: 'Souscription abonnement validee via Stripe Checkout',
        createdBy: 'system',
      },
    });

    // Creer la facture pour la premiere echeance (non-bloquant)
    try {
      const { createInvoiceRecord } = await import('@/lib/invoice-creation');
      const firstDeadline = await prisma.subscriptionDeadline.findFirst({
        where: { subscriptionId: subscription.id, deadlineNumber: 1 },
      });
      await createInvoiceRecord({
        userId: userId,
        type: 'SUBSCRIPTION',
        totalCents: 990,
        paidAt: now,
        deadlineId: firstDeadline?.id,
      });
    } catch (err) {
      console.error('[Webhook] Erreur creation facture 1ere echeance:', err);
    }

    // Consommer un usage sur l'abonnement (non-bloquant)
    if (processType) {
      try {
        const { consumeSubscriptionProcess } = await import('@/lib/subscription/process-eligibility');
        await consumeSubscriptionProcess(
          subscription.id,
          existingProcess.id,
          processType as ProcessType
        );
      } catch (err) {
        console.error('[Webhook] Erreur consommation usage abonnement:', err);
      }
    }

    // Envoyer a Advercity
    await sendProcessToAdvercity(existingProcess.id);

    // Email de confirmation (non-bloquant)
    sendEmail({
      to: existingProcess.user.email,
      subject: `Confirmation de votre abonnement et demarche ${processReference}`,
      template: 'process-confirmation',
      data: {
        firstName: existingProcess.user.firstName,
        reference: processReference,
        isFromSubscription: true,
      },
    }).catch((err) => console.error('[Webhook] Erreur envoi email confirmation:', err));
  }
  // Le mode 'payment' est gere par handlePaymentSucceeded via payment_intent.succeeded
}

// Envoyer une demarche payee a Advercity
async function sendProcessToAdvercity(processId: string): Promise<void> {
  const appUrl = globalThis.process?.env?.NEXT_PUBLIC_APP_URL || '';

  const paidProcess = await prisma.process.findUnique({
    where: { id: processId },
    include: { user: true },
  });

  if (!paidProcess || paidProcess.status !== 'PAID') return;

  try {
    const advercityResponse = await createAdvercityProcess({
      type: mapProcessTypeToAdvercity(paidProcess.type),
      external_reference: paidProcess.reference,
      webhook_url: `${appUrl}/api/advercity/webhook`,
      data: mapProcessDataToAdvercity(
        paidProcess.type,
        paidProcess.data as Record<string, unknown>,
        {
          email: paidProcess.user.email,
          firstName: paidProcess.user.firstName,
          lastName: paidProcess.user.lastName,
        }
      ),
    });

    await prisma.process.update({
      where: { id: processId },
      data: {
        status: 'SENT_TO_ADVERCITY',
        advercityId: advercityResponse.advercity_id,
        advercityRef: advercityResponse.advercity_reference,
        submittedAt: new Date(),
        lastSyncAt: new Date(),
      },
    });

    await prisma.processStatusHistory.create({
      data: {
        processId,
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
  } catch (error) {
    console.error(`[Webhook] Erreur envoi Advercity pour ${paidProcess.reference}:`, error);
    // La demarche reste en PAID, retry ulterieur possible
  }
}

// Helpers
function mapPSPStatusToSubscriptionStatus(status?: string): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'ACTIVE';
    case 'past_due':
    case 'unpaid':
      return 'PAST_DUE';
    case 'canceled':
    case 'incomplete_expired':
      return 'CANCELED';
    default:
      return 'ACTIVE';
  }
}
