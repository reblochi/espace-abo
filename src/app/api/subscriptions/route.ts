// API Route - Abonnements

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { createSubscriptionSchema } from '@/schemas';
import { getDefaultPSPAdapter } from '@/lib/psp';
import { generateReference } from '@/lib/utils';

// POST /api/subscriptions - Creer un abonnement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json();
    const result = createSubscriptionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation echouee', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { priceId, paymentMethodId } = result.data;

    // Verifier si deja abonne
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (existingSubscription?.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Abonnement deja actif' },
        { status: 400 }
      );
    }

    // Recuperer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    // Utiliser l'adaptateur PSP
    const psp = getDefaultPSPAdapter();

    // Creer l'abonnement via PSP
    const pspResult = await psp.createSubscription({
      customerId: existingSubscription?.pspCustomerId || undefined,
      email: user.email,
      priceId,
      paymentMethodId,
      metadata: {
        userId: user.id,
      },
    });

    // Generer reference unique
    const count = await prisma.subscription.count();
    const reference = generateReference('SUB', count + 1);

    // Calculer les dates
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Creer ou mettre a jour en BDD
    const subscription = await prisma.subscription.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        reference,
        status: pspResult.status === 'active' ? 'ACTIVE' : 'PENDING',
        amountCents: 990, // 9.90 EUR
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        pspProvider: psp.provider,
        pspCustomerId: pspResult.customerId,
        pspSubscriptionId: pspResult.subscriptionId,
      },
      update: {
        status: pspResult.status === 'active' ? 'ACTIVE' : 'PENDING',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        pspSubscriptionId: pspResult.subscriptionId,
        pspCustomerId: pspResult.customerId,
      },
    });

    // Creer la premiere echeance
    await prisma.subscriptionDeadline.create({
      data: {
        subscriptionId: subscription.id,
        deadlineNumber: 1,
        amountCents: subscription.amountCents,
        dueDate: now,
        status: pspResult.status === 'active' ? 'PERFORMED' : 'UPCOMING',
        paymentStatus: pspResult.status === 'active' ? 'PAID' : 'PENDING',
        paidAt: pspResult.status === 'active' ? now : null,
      },
    });

    return NextResponse.json({
      subscription,
      clientSecret: pspResult.clientSecret,
      redirectUrl: pspResult.redirectUrl,
    });
  } catch (error) {
    console.error('Erreur creation abonnement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la creation de l\'abonnement' },
      { status: 500 }
    );
  }
}
