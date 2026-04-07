// API publique - Ingestion events de tracking formulaires
// Pas d'authentification (les formulaires embed sont anonymes)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const eventSchema = z.object({
  sessionId: z.string().min(1).max(64),
  formType: z.string().min(1).max(50),
  stepIndex: z.number().int().min(-1).max(20),
  stepName: z.string().min(1).max(50),
  event: z.enum(['FORM_STARTED', 'STEP_ENTERED', 'STEP_COMPLETED', 'FORM_COMPLETED', 'FORM_ABANDONED']),
  partner: z.string().max(100).optional(),
  pricingCode: z.string().max(20).optional(),
  source: z.string().max(20).optional(),
  processId: z.string().max(50).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const batchSchema = z.object({
  events: z.array(eventSchema).min(1).max(50), // Max 50 events par batch
});

export async function POST(request: NextRequest) {
  try {
    // sendBeacon envoie en text/plain, pas application/json
    let body: unknown;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
      }
    }

    const parsed = batchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 });
    }

    const { events } = parsed.data;

    // Batch insert
    await prisma.formEvent.createMany({
      data: events.map((e) => ({
        sessionId: e.sessionId,
        formType: e.formType,
        stepIndex: e.stepIndex,
        stepName: e.stepName,
        event: e.event,
        partner: e.partner || null,
        pricingCode: e.pricingCode || null,
        source: e.source || null,
        processId: e.processId || null,
        metadata: e.metadata ?? null,
      })) as any,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Tracking error:', error);
    // Ne pas renvoyer 500 pour ne pas bloquer le client
    return NextResponse.json({ ok: true });
  }
}
