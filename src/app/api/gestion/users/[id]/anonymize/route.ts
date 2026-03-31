// API Admin - Anonymiser les donnees de traitement d'un client

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminOrAgent, logAdminAction } from '@/lib/admin-auth';
import { anonymizeUser } from '@/lib/anonymize';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminOrAgent();
  if (!session) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const result = await anonymizeUser(id);

    await logAdminAction(
      session.user.id,
      'anonymize_user',
      'User',
      id,
      result
    );

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
