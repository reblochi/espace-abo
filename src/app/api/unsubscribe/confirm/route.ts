// API Route: Confirmation de desabonnement via token

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPSPAdapter } from '@/lib/psp';
import { sendEmail } from '@/lib/email';
import { formatCurrency, formatDate } from '@/lib/utils';
import crypto from 'crypto';
import type { PSPProvider } from '@/lib/psp/types';

// GET: Valider le token et retourner les infos de l'abonnement
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token manquant.' });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { unsubscribeToken: token },
      include: { user: true },
    });

    if (!subscription) {
      return NextResponse.json({ valid: false, error: 'Lien invalide ou deja utilise.' });
    }

    if (subscription.status !== 'ACTIVE' && subscription.status !== 'PAST_DUE') {
      return NextResponse.json({
        valid: false,
        error: 'Cet abonnement est deja resilie.',
      });
    }

    return NextResponse.json({
      valid: true,
      reference: subscription.reference,
      amount: formatCurrency(subscription.amountCents),
      currentPeriodEnd: formatDate(subscription.currentPeriodEnd),
      email: subscription.user.email,
    });
  } catch (error) {
    console.error('[Unsubscribe Confirm GET] Erreur:', error);
    return NextResponse.json(
      { valid: false, error: 'Une erreur est survenue.' },
      { status: 500 }
    );
  }
}

// POST: Annuler l'abonnement
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token manquant.' }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { unsubscribeToken: token },
      include: { user: true },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Lien invalide ou deja utilise.' }, { status: 400 });
    }

    if (subscription.status !== 'ACTIVE' && subscription.status !== 'PAST_DUE') {
      return NextResponse.json({ error: 'Cet abonnement est deja resilie.' }, { status: 400 });
    }

    // Annuler cote PSP (fin de periode)
    if (subscription.pspSubscriptionId) {
      try {
        const adapter = getPSPAdapter(subscription.pspProvider as PSPProvider);
        await adapter.cancelSubscription(subscription.pspSubscriptionId, false);
      } catch (pspError) {
        console.error('[Unsubscribe] Erreur annulation PSP:', pspError);
        // On continue quand meme pour marquer en base
      }
    }

    // Mettre a jour en base
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
        endDate: subscription.currentPeriodEnd,
        // Regenerer le token pour invalider l'ancien lien
        unsubscribeToken: crypto.randomBytes(32).toString('hex'),
      },
    });

    // Email de confirmation
    await sendEmail({
      to: subscription.user.email,
      subject: 'Confirmation d\'annulation de votre abonnement',
      template: 'subscription-canceled',
      data: {
        firstName: subscription.user.firstName,
        endDate: formatDate(subscription.currentPeriodEnd),
      },
    });

    return NextResponse.json({
      success: true,
      endDate: formatDate(subscription.currentPeriodEnd),
      message: `Votre abonnement a ete resilie. Vos droits restent actifs jusqu'au ${formatDate(subscription.currentPeriodEnd)}.`,
    });
  } catch (error) {
    console.error('[Unsubscribe Confirm POST] Erreur:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Veuillez reessayer.' },
      { status: 500 }
    );
  }
}
