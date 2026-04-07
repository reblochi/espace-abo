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

  // Ignorer les events non mappes
  if (!event.type) {
    return { success: true, message: 'Event type non mappe, ignore' };
  }

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

    case 'charge.dispute.created':
      await handleDisputeCreated(event);
      break;

    case 'charge.dispute.updated':
      await handleDisputeUpdated(event);
      break;

    case 'charge.dispute.closed':
      await handleDisputeClosed(event);
      break;

    case 'customer.updated':
      await handleCustomerUpdated(event);
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

  // Chercher le process associe (idempotent : ne pas re-rembourser)
  const process = await prisma.process.findFirst({
    where: { pspPaymentId: paymentId },
  });

  if (process && process.status !== 'REFUNDED') {
    await prisma.process.update({
      where: { id: process.id },
      data: { status: 'REFUNDED' },
    });
  }

  // Chercher l'echeance associee (idempotent : skip si deja REFUNDED)
  const deadline = await prisma.subscriptionDeadline.findFirst({
    where: { pspInvoiceId: paymentId },
  });

  if (deadline && deadline.paymentStatus !== 'REFUNDED') {
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
          email: (paidProcess.data as Record<string, unknown>).email as string || paidProcess.user.email,
          firstName: paidProcess.user.firstName,
          lastName: paidProcess.user.lastName,
          phone: (paidProcess.data as Record<string, unknown>).telephone as string || undefined,
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

// Handlers Dispute / Chargeback
async function handleDisputeCreated(event: WebhookEvent): Promise<void> {
  const { disputeId, paymentId, amountCents, disputeReason, disputeStatus } = event.data;
  if (!disputeId || !paymentId) return;

  // Verifier qu'on n'a pas deja ce litige
  const existing = await prisma.dispute.findUnique({ where: { pspDisputeId: disputeId } });
  if (existing) return;

  // Trouver le paiement d'origine : echeance ou demarche
  // paymentId est un charge ID (ch_xxx) pour les disputes Stripe.
  // On doit resoudre : charge -> payment_intent -> invoice pour trouver l'echeance,
  // ou charge -> payment_intent pour trouver la demarche.
  let subscriptionId: string | undefined;
  let deadlineId: string | undefined;
  let processId: string | undefined;
  let userId: string | undefined;

  // Resolution PSP-specifique : Stripe utilise charge -> payment_intent -> invoice.
  // Les autres PSPs envoient directement l'ID transaction utilisable pour la recherche DB.
  let resolvedInvoiceId: string | undefined;
  let resolvedPaymentIntentId: string | undefined;
  if (event.provider === 'stripe' && paymentId.startsWith('ch_')) {
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(globalThis.process?.env?.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' });
      const charge = await stripe.charges.retrieve(paymentId);
      resolvedPaymentIntentId = charge.payment_intent as string;
      if (resolvedPaymentIntentId) {
        // Recuperer le payment_intent pour trouver l'invoice liee
        const pi = await stripe.paymentIntents.retrieve(resolvedPaymentIntentId);
        if (pi.invoice) {
          resolvedInvoiceId = typeof pi.invoice === 'string' ? pi.invoice : pi.invoice.id;
        }
      }
    } catch (err) {
      console.error('[Webhook] Erreur resolution charge -> invoice:', err);
    }
  }

  // Chercher l'echeance par invoice ID Stripe (in_xxx)
  if (resolvedInvoiceId) {
    const deadline = await prisma.subscriptionDeadline.findFirst({
      where: { pspInvoiceId: resolvedInvoiceId },
      include: { subscription: true },
    });
    if (deadline) {
      subscriptionId = deadline.subscriptionId;
      deadlineId = deadline.id;
      userId = deadline.subscription.userId;
    }
  }

  // Fallback pour PSPs non-Stripe : chercher l'echeance par le paymentId direct
  if (!userId && !resolvedInvoiceId) {
    const deadline = await prisma.subscriptionDeadline.findFirst({
      where: { pspInvoiceId: paymentId },
      include: { subscription: true },
    });
    if (deadline) {
      subscriptionId = deadline.subscriptionId;
      deadlineId = deadline.id;
      userId = deadline.subscription.userId;
    }
  }

  // Chercher la demarche par payment_intent, pspPaymentId, ou stripePaymentIntent
  if (!userId) {
    const lookupIds = [resolvedPaymentIntentId, paymentId].filter(Boolean) as string[];
    for (const pid of lookupIds) {
      const process = await prisma.process.findFirst({
        where: { OR: [{ pspPaymentId: pid }, { stripePaymentIntent: pid }] },
      });
      if (process) {
        processId = process.id;
        userId = process.userId;
        break;
      }
    }
  }

  // Creer le litige
  const dispute = await prisma.dispute.create({
    data: {
      subscriptionId,
      deadlineId,
      processId,
      pspProvider: event.provider,
      pspDisputeId: disputeId,
      pspPaymentId: paymentId,
      amountCents: amountCents || 0,
      status: mapDisputeStatus(disputeStatus),
      reason: disputeReason,
      disputedAt: new Date(),
    },
  });

  // L'avoir sera cree seulement si le litige est perdu (handleDisputeClosed)
  // pour eviter de fausser la compta si on gagne le litige

  console.log(`[Webhook] Dispute cree: ${disputeId}, montant: ${amountCents}`);
}

async function handleDisputeUpdated(event: WebhookEvent): Promise<void> {
  const { disputeId, disputeStatus } = event.data;
  if (!disputeId) return;

  await prisma.dispute.updateMany({
    where: { pspDisputeId: disputeId },
    data: { status: mapDisputeStatus(disputeStatus) },
  });
}

async function handleDisputeClosed(event: WebhookEvent): Promise<void> {
  const { disputeId, disputeStatus } = event.data;
  if (!disputeId) return;

  const isLost = disputeStatus !== 'won';
  const status = isLost ? 'LOST' : 'WON';

  await prisma.dispute.updateMany({
    where: { pspDisputeId: disputeId },
    data: {
      status: status as 'WON' | 'LOST',
      resolvedAt: new Date(),
    },
  });

  // Creer l'avoir seulement si le litige est perdu (chargeback confirme)
  if (isLost) {
    const dispute = await prisma.dispute.findFirst({ where: { pspDisputeId: disputeId } });
    if (dispute && !dispute.creditNoteId) {
      // Trouver le userId via la subscription ou le process
      let userId: string | undefined;
      if (dispute.subscriptionId) {
        const sub = await prisma.subscription.findUnique({ where: { id: dispute.subscriptionId }, select: { userId: true } });
        userId = sub?.userId;
      } else if (dispute.processId) {
        const proc = await prisma.process.findUnique({ where: { id: dispute.processId }, select: { userId: true } });
        userId = proc?.userId;
      }

      if (userId && dispute.amountCents > 0) {
        try {
          const { createCreditNote } = await import('@/lib/invoice-creation');
          const creditNote = await createCreditNote({
            userId,
            totalCents: dispute.amountCents,
            reason: `Chargeback perdu ${disputeId} - ${dispute.reason || 'non specifie'}`,
          });
          await prisma.dispute.update({
            where: { id: dispute.id },
            data: { creditNoteId: creditNote.id },
          });
        } catch (err) {
          console.error('[Webhook] Erreur creation avoir pour dispute perdu:', err);
        }
      }
    }
  }
}

// Handler customer.updated - sync info carte
async function handleCustomerUpdated(event: WebhookEvent): Promise<void> {
  const { customerId } = event.data;
  if (!customerId) return;

  const subscription = await prisma.subscription.findFirst({
    where: { pspCustomerId: customerId },
  });

  if (!subscription || subscription.pspProvider !== 'stripe') return;

  // Recuperer les infos carte depuis Stripe
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(globalThis.process?.env?.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    });

    const customer = await stripe.customers.retrieve(customerId, {
      expand: ['invoice_settings.default_payment_method'],
    });

    if (customer.deleted) return;

    const pm = customer.invoice_settings?.default_payment_method;
    if (pm && typeof pm !== 'string' && pm.card) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          cardBrand: pm.card.brand,
          cardLast4: pm.card.last4,
          cardExpMonth: pm.card.exp_month,
          cardExpYear: pm.card.exp_year,
        },
      });
    }
  } catch (err) {
    console.error('[Webhook] Erreur sync carte:', err);
  }
}

function mapDisputeStatus(status?: string): 'NEEDS_RESPONSE' | 'UNDER_REVIEW' | 'WON' | 'LOST' {
  switch (status) {
    case 'needs_response': return 'NEEDS_RESPONSE';
    case 'under_review': return 'UNDER_REVIEW';
    case 'won': return 'WON';
    case 'lost': return 'LOST';
    default: return 'NEEDS_RESPONSE';
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
