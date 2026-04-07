// GET /api/processes/restore?ref=XXX
// Retourne les données d'un Process PENDING_PAYMENT pour restaurer le formulaire après annulation de paiement

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref');

  if (!ref) {
    return NextResponse.json({ error: 'Reference manquante' }, { status: 400 });
  }

  const process = await prisma.process.findFirst({
    where: {
      reference: ref,
      status: 'PENDING_PAYMENT',
    },
    select: {
      id: true,
      reference: true,
      type: true,
      data: true,
    },
  });

  if (!process) {
    return NextResponse.json({ error: 'Demarche non trouvee' }, { status: 404 });
  }

  return NextResponse.json({
    reference: process.reference,
    type: process.type,
    data: process.data,
  });
}
