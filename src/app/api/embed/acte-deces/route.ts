// API Route publique - Soumission acte de deces via widget embed
// Pas d'authentification requise, les coordonnees sont collectees dans le formulaire

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { deathCertificateSchema } from '@/schemas/death-certificate';
import { generateReference } from '@/lib/utils';
import { generateClientReference } from '@/lib/client-reference';
import { checkProcessEligibility, consumeSubscriptionProcess } from '@/lib/subscription/process-eligibility';
import bcrypt from 'bcryptjs';

const embedSubmitSchema = z.object({
  partner: z.string(),
  paymentMode: z.enum(['subscription', 'one_time']),
  subscriptionConsent: z.boolean().optional(),
  pricingCode: z.string().optional(),
  data: deathCertificateSchema,
});

// POST /api/embed/acte-deces
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

    const { partner, paymentMode, pricingCode, data } = parsed.data;

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
      // Creer un compte avec un mot de passe temporaire aleatoire
      const tempPassword = Math.random().toString(36).slice(-12);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const clientRef = await generateClientReference();
      user = await prisma.user.create({
        data: {
          reference: clientRef,
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
    const eligibility = await checkProcessEligibility(user.id, 'CIVIL_STATUS_DEATH');

    // Generer la reference de la demarche
    const count = await prisma.process.count();
    const reference = generateReference('DEM', count + 1);

    const basePrice = 1490; // 14,90 EUR en centimes

    if (eligibility.eligible && eligibility.subscriptionId) {
      // Abonne actif : creer la demarche directement en PAID et consommer un credit
      const process = await prisma.process.create({
        data: {
          reference,
          userId: user.id,
          type: 'CIVIL_STATUS_DEATH',
          status: 'PAID',
          amountCents: 0, // Inclus dans l'abonnement
          isFromSubscription: true,
          data: data as any,
          partner,
          pricingCode: pricingCode ?? null,
          source: 'embed',
          updatedAt: new Date(),
        },
      });

      await consumeSubscriptionProcess(
        eligibility.subscriptionId,
        process.id,
        'CIVIL_STATUS_DEATH'
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
        type: 'CIVIL_STATUS_DEATH',
        status: 'PENDING_PAYMENT',
        amountCents: basePrice,
        data: data as any,
        partner,
        pricingCode: pricingCode ?? null,
        source: 'embed',
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
    console.error('Erreur embed acte-deces:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la demarche' },
      { status: 500 }
    );
  }
}
