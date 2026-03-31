// API - Anonymisation RGPD (demande par l'utilisateur lui-meme)

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { anonymizeUser } from '@/lib/anonymize';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }

  try {
    await anonymizeUser(session.user.id);
    return NextResponse.json({ success: true, message: 'Vos donnees personnelles ont ete anonymisees.' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
