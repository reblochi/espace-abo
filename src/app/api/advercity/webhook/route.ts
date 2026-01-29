// API Route - Webhook Advercity

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { mapAdvercityStatusToProcessStatus } from '@/lib/advercity';

// POST /api/advercity/webhook - Reception des notifications Advercity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('X-Webhook-Secret');

    // Verifier signature
    const expectedSignature = process.env.ADVERCITY_WEBHOOK_SECRET;
    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
    }

    const {
      event,
      external_reference,
      advercity_reference,
      step,
      message,
    } = body;

    // Trouver le process
    const demarche = await prisma.process.findFirst({
      where: { reference: external_reference },
      include: { user: true },
    });

    if (!demarche) {
      console.log(`[Advercity Webhook] Process non trouve: ${external_reference}`);
      return NextResponse.json({ error: 'Process non trouve' }, { status: 404 });
    }

    // Mettre a jour selon l'evenement
    let newStatus = demarche.status;
    let shouldNotify = false;

    switch (event) {
      case 'step_changed':
        newStatus = mapAdvercityStatusToProcessStatus(step);
        break;

      case 'process_completed':
        newStatus = 'COMPLETED';
        shouldNotify = true;
        break;

      case 'process_error':
        console.error('[Advercity Webhook] Erreur process:', body);
        // Ne pas changer le statut, juste logger
        break;

      case 'process_refunded':
        newStatus = 'REFUNDED';
        shouldNotify = true;
        break;

      default:
        console.log(`[Advercity Webhook] Event non gere: ${event}`);
    }

    // Mettre a jour en BDD
    await prisma.process.update({
      where: { id: demarche.id },
      data: {
        status: newStatus,
        advercityStatus: step,
        advercityRef: advercity_reference || demarche.advercityRef,
        lastSyncAt: new Date(),
      },
    });

    // Notifier le client si necessaire
    if (shouldNotify) {
      const emailTemplate = newStatus === 'COMPLETED' ? 'process-completed' : 'process-confirmation';
      const subject = newStatus === 'COMPLETED'
        ? `Votre demarche ${demarche.reference} est terminee`
        : `Mise a jour de votre demarche ${demarche.reference}`;

      await sendEmail({
        to: demarche.user.email,
        subject,
        template: emailTemplate,
        data: {
          firstName: demarche.user.firstName,
          reference: demarche.reference,
          status: newStatus,
          message,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur webhook Advercity:', error);
    return NextResponse.json(
      { error: 'Erreur traitement webhook' },
      { status: 500 }
    );
  }
}
