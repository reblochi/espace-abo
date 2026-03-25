// API Route publique - Soumission carte d'identite via widget embed
// Pas d'authentification requise, les coordonnees sont collectees dans le formulaire

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { identityCardSchema } from '@/schemas/identity-card';
import { generateReference } from '@/lib/utils';
import { checkProcessEligibility, consumeSubscriptionProcess } from '@/lib/subscription/process-eligibility';
import { calculateStampTax } from '@/types/identity-card';
import { PROCESS_TYPES_CONFIG } from '@/lib/process-types';
import bcrypt from 'bcryptjs';

const embedSubmitSchema = z.object({
  partner: z.string(),
  paymentMode: z.enum(['subscription', 'one_time']),
  subscriptionConsent: z.boolean().optional(),
  data: identityCardSchema,
});

// POST /api/embed/carte-identite
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = embedSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { partner, paymentMode, data } = parsed.data;

    // Les coordonnees sont obligatoires en mode embed
    if (!data.contact) {
      return NextResponse.json(
        { error: 'Coordonnees requises' },
        { status: 400 }
      );
    }

    const { email, firstName, lastName, phone } = data.contact;

    // Trouver ou creer l'utilisateur par email
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const tempPassword = Math.random().toString(36).slice(-12);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          phone: phone || null,
          passwordHash,
          updatedAt: new Date(),
        },
      });
    }

    // Verifier si l'utilisateur a un abonnement actif
    const eligibility = await checkProcessEligibility(user.id, 'IDENTITY_CARD');

    // Generer la reference de la demarche
    const count = await prisma.process.count();
    const reference = generateReference('DEM', count + 1);

    const basePrice = PROCESS_TYPES_CONFIG.IDENTITY_CARD.basePrice;
    const stampTax = calculateStampTax(data.motif, data.deliveryAddress?.zipCode);
    const totalPrice = basePrice + stampTax;

    if (eligibility.eligible && eligibility.subscriptionId) {
      // Abonne actif : creer la demarche directement en PAID
      const process = await prisma.process.create({
        data: {
          reference,
          userId: user.id,
          type: 'IDENTITY_CARD',
          status: 'PAID',
          amountCents: stampTax, // Seul le timbre fiscal reste a payer pour les abonnes
          isFromSubscription: true,
          data: data as any,
          updatedAt: new Date(),
        },
      });

      await consumeSubscriptionProcess(
        eligibility.subscriptionId,
        process.id,
        'IDENTITY_CARD'
      );

      return NextResponse.json({
        reference: process.reference,
        isSubscriber: true,
      });
    }

    // Non abonne : creer la demarche en attente de paiement
    const process = await prisma.process.create({
      data: {
        reference,
        userId: user.id,
        type: 'IDENTITY_CARD',
        status: 'PENDING_PAYMENT',
        amountCents: totalPrice,
        data: data as any,
        updatedAt: new Date(),
      },
    });

    // Rediriger vers le checkout
    const checkoutUrl = new URL('/checkout', request.nextUrl.origin);
    checkoutUrl.searchParams.set('ref', process.reference);
    checkoutUrl.searchParams.set('mode', paymentMode);
    checkoutUrl.searchParams.set('partner', partner);

    return NextResponse.json({
      reference: process.reference,
      isSubscriber: false,
      url: checkoutUrl.toString(),
    });
  } catch (error) {
    console.error('Erreur embed carte-identite:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la demarche' },
      { status: 500 }
    );
  }
}
