// Enregistrement des consentements (preuve légale)

import { prisma } from '@/lib/db';
import { CGV_VERSION, CGV_HASH } from '@/lib/cgv';

export function getClientInfo(request: Request) {
  return {
    ipAddress:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('cf-connecting-ip') ||
      'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

interface RecordConsentInput {
  userId: string;
  type: 'SUBSCRIPTION_CGV' | 'PROCESS_CGV';
  request: Request;
  metadata?: Record<string, unknown>;
}

/**
 * Enregistre un consentement en BDD avec IP, user-agent et hash des CGV.
 * Retourne l'ID du consent pour enrichissement ultérieur (ex: 3DS).
 */
export async function recordConsent({ userId, type, request, metadata }: RecordConsentInput) {
  const { ipAddress, userAgent } = getClientInfo(request);

  return prisma.consent.create({
    data: {
      userId,
      type,
      version: CGV_VERSION,
      textHash: CGV_HASH,
      ipAddress,
      userAgent,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  });
}

/**
 * Enrichit un consentement avec le résultat de l'authentification forte (3DS, etc.)
 * Appelé après le retour du PSP (verify).
 */
export async function updateConsentStrongAuth(consentId: string, strongAuth: string) {
  return prisma.consent.update({
    where: { id: consentId },
    data: { strongAuth },
  });
}
