// API Route - Webhook PSP (Stripe par defaut)

import { NextRequest, NextResponse } from 'next/server';
import { handlePSPWebhook } from '@/lib/psp/webhook-handler';

export async function POST(request: NextRequest) {
  try {
    const result = await handlePSPWebhook(request, 'stripe');

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erreur webhook:', error);
    return NextResponse.json(
      { error: 'Erreur traitement webhook' },
      { status: 500 }
    );
  }
}
