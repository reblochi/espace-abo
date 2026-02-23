// API Route - Webhook Advercity

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import {
  mapAdvercityStatusToProcessStatus,
  getAdvercityStepLabel,
  verifyWebhookSignature,
  type AdvercityWebhookEvent,
  type ProcessStepChangedWebhook,
  type ProcessCompletedWebhook,
  type ProcessErrorWebhook,
  type ProcessAwaitingInfoWebhook,
} from '@/lib/advercity';
import { releaseSubscriptionProcess } from '@/lib/subscription/process-eligibility';
import type { ProcessStatus } from '@prisma/client';

// POST /api/advercity/webhook - Reception des notifications Advercity
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('X-Advercity-Signature') || request.headers.get('X-Webhook-Secret');

    // Verifier signature (support deux methodes)
    const webhookSecret = process.env.ADVERCITY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const isValidHmac = signature && verifyWebhookSignature(rawBody, signature, webhookSecret);
      const isValidSimple = signature === webhookSecret;

      if (!isValidHmac && !isValidSimple) {
        console.error('[Advercity Webhook] Signature invalide');
        return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody) as AdvercityWebhookEvent;
    const {
      event,
      external_reference,
      advercity_reference,
      advercity_id,
      timestamp,
    } = body;

    console.log(`[Advercity Webhook] Event recu: ${event} pour ${external_reference}`);

    // Trouver le process
    const demarche = await prisma.process.findFirst({
      where: {
        OR: [
          { reference: external_reference },
          { advercityRef: advercity_reference },
          { advercityId: String(advercity_id) },
        ],
      },
      include: { user: true },
    });

    if (!demarche) {
      console.log(`[Advercity Webhook] Process non trouve: ${external_reference}`);
      return NextResponse.json({ error: 'Process non trouve' }, { status: 404 });
    }

    const oldStatus = demarche.status;
    let newStatus: ProcessStatus = oldStatus;
    let shouldNotify = false;
    let emailTemplate: string = 'process-status-update';
    let emailSubject = `Mise a jour de votre demarche ${demarche.reference}`;
    let historyReason = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let historyMetadata: any = { event, timestamp };

    // Traitement selon l'evenement (cast string pour supporter les events futurs/legacy)
    switch (event as string) {
      case 'process.step_changed': {
        const stepPayload = body as ProcessStepChangedWebhook;
        newStatus = mapAdvercityStatusToProcessStatus(stepPayload.new_step);
        historyReason = `Changement d'etape: ${getAdvercityStepLabel(stepPayload.old_step)} -> ${getAdvercityStepLabel(stepPayload.new_step)}`;
        historyMetadata = {
          ...historyMetadata,
          old_step: stepPayload.old_step,
          new_step: stepPayload.new_step,
          step_label: stepPayload.step_label,
        };

        // Notifier si changement significatif
        if (oldStatus !== newStatus) {
          shouldNotify = true;
          emailSubject = `Votre demarche ${demarche.reference} avance`;
        }
        break;
      }

      case 'process.completed': {
        const completedPayload = body as ProcessCompletedWebhook;
        newStatus = 'COMPLETED';
        shouldNotify = true;
        emailTemplate = 'process-completed';
        emailSubject = `Votre demarche ${demarche.reference} est terminee !`;
        historyReason = `Demarche terminee (${completedPayload.completion_type})`;
        historyMetadata = {
          ...historyMetadata,
          completion_type: completedPayload.completion_type,
          tracking_number: completedPayload.tracking_number,
        };

        // Mettre a jour la date de completion
        await prisma.process.update({
          where: { id: demarche.id },
          data: { completedAt: new Date() },
        });
        break;
      }

      case 'process.error': {
        const errorPayload = body as ProcessErrorWebhook;
        console.error('[Advercity Webhook] Erreur process:', errorPayload);
        historyReason = `Erreur: ${errorPayload.error_message}`;
        historyMetadata = {
          ...historyMetadata,
          error_code: errorPayload.error_code,
          error_message: errorPayload.error_message,
          requires_action: errorPayload.requires_action,
        };

        if (errorPayload.requires_action) {
          newStatus = 'AWAITING_INFO';
          shouldNotify = true;
          emailTemplate = 'process-action-required';
          emailSubject = `Action requise pour votre demarche ${demarche.reference}`;
        }
        break;
      }

      case 'process.awaiting_info': {
        const awaitingPayload = body as ProcessAwaitingInfoWebhook;
        newStatus = 'AWAITING_INFO';
        shouldNotify = true;
        emailTemplate = 'process-documents-required';
        emailSubject = `Documents requis pour votre demarche ${demarche.reference}`;
        historyReason = `En attente d'informations: ${awaitingPayload.message}`;
        historyMetadata = {
          ...historyMetadata,
          required_documents: awaitingPayload.required_documents,
          message: awaitingPayload.message,
        };
        break;
      }

      case 'process.refunded':
      case 'process_refunded': {
        newStatus = 'REFUNDED';
        shouldNotify = true;
        emailTemplate = 'process-refunded';
        emailSubject = `Remboursement de votre demarche ${demarche.reference}`;
        historyReason = 'Demarche remboursee';

        // Si la demarche etait via abonnement, liberer le quota
        if (demarche.isFromSubscription) {
          try {
            await releaseSubscriptionProcess(demarche.id);
            historyMetadata = { ...historyMetadata, subscription_quota_released: true };
          } catch (e) {
            console.error('[Advercity Webhook] Erreur liberation quota:', e);
          }
        }
        break;
      }

      // Support ancien format
      case 'step_changed': {
        const step = (body as unknown as { step: number }).step;
        newStatus = mapAdvercityStatusToProcessStatus(step);
        historyReason = `Changement d'etape Advercity: ${step}`;

        if (oldStatus !== newStatus) {
          shouldNotify = true;
        }
        break;
      }

      default:
        console.log(`[Advercity Webhook] Event non gere: ${event}`);
        historyReason = `Event non gere: ${event}`;
    }

    // Enregistrer l'historique si changement de statut
    if (oldStatus !== newStatus) {
      await prisma.processStatusHistory.create({
        data: {
          processId: demarche.id,
          fromStatus: oldStatus,
          toStatus: newStatus,
          reason: historyReason,
          metadata: historyMetadata,
          createdBy: 'advercity-webhook',
        },
      });
    }

    // Mettre a jour le process
    await prisma.process.update({
      where: { id: demarche.id },
      data: {
        status: newStatus,
        advercityStatus: (body as { new_step?: number; step?: number }).new_step ||
                        (body as { step?: number }).step ||
                        demarche.advercityStatus,
        advercityRef: advercity_reference || demarche.advercityRef,
        advercityId: String(advercity_id) || demarche.advercityId,
        lastSyncAt: new Date(),
      },
    });

    // Notifier le client si necessaire
    if (shouldNotify && demarche.user?.email) {
      try {
        await sendEmail({
          to: demarche.user.email,
          subject: emailSubject,
          template: emailTemplate as any,
          data: {
            firstName: demarche.user.firstName,
            reference: demarche.reference,
            type: demarche.type,
            oldStatus,
            newStatus,
            statusLabel: getAdvercityStepLabel(
              (body as { new_step?: number }).new_step || 0
            ),
            message: (body as { message?: string }).message,
            trackingNumber: (body as ProcessCompletedWebhook).tracking_number,
            requiredDocuments: (body as ProcessAwaitingInfoWebhook).required_documents,
          },
        });
      } catch (emailError) {
        console.error('[Advercity Webhook] Erreur envoi email:', emailError);
        // Ne pas echouer le webhook pour une erreur email
      }
    }

    console.log(`[Advercity Webhook] Traitement termine: ${oldStatus} -> ${newStatus}`);
    return NextResponse.json({ success: true, oldStatus, newStatus });
  } catch (error) {
    console.error('Erreur webhook Advercity:', error);
    return NextResponse.json(
      { error: 'Erreur traitement webhook' },
      { status: 500 }
    );
  }
}
