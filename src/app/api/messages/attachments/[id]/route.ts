// Proxy de telechargement d'une PJ d'un message Advercity.
// Verifie la session espace-abo, signe HMAC pour le compte du user,
// et stream la reponse de l'API Advercity.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { advercityClient, signAdvercityCustomer } from '@/lib/advercity';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { advercityCustomerId: true },
  });
  if (!user?.advercityCustomerId) {
    return NextResponse.json({ error: 'Compte non lié' }, { status: 409 });
  }

  const { id } = await params;
  const attachmentId = parseInt(id, 10);
  if (!Number.isFinite(attachmentId) || attachmentId <= 0) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
  }

  const sig = signAdvercityCustomer(user.advercityCustomerId);

  try {
    const upstream = await advercityClient.get(`/api/external/messages/attachments/${attachmentId}`, {
      params: {
        customer_id: sig.customer_id,
        expires: sig.expires,
        signature: sig.signature,
      },
      responseType: 'arraybuffer',
      validateStatus: () => true,
    });

    if (upstream.status !== 200) {
      return NextResponse.json({ error: 'Indisponible' }, { status: upstream.status });
    }

    const contentType = upstream.headers['content-type'] || 'application/octet-stream';
    const disposition = upstream.headers['content-disposition'] || `attachment; filename="attachment-${attachmentId}"`;

    return new NextResponse(upstream.data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
      },
    });
  } catch (err) {
    console.error('Erreur proxy attachment:', err);
    return NextResponse.json({ error: 'Erreur réseau' }, { status: 502 });
  }
}
