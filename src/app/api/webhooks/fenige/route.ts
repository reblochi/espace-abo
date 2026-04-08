// API Route - Webhook Fenige

import { NextRequest, NextResponse } from 'next/server';
import { handlePSPWebhook } from '@/lib/psp/webhook-handler';

export async function POST(request: NextRequest) {
  try {
    const result = await handlePSPWebhook(request, 'fenige');

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erreur webhook Fenige:', error);
    return NextResponse.json(
      { error: 'Erreur traitement webhook' },
      { status: 500 }
    );
  }
}
