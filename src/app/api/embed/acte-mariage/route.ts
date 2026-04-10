// API Route publique - Soumission acte de mariage via widget embed
// Pas d'authentification requise, les coordonnees sont collectees dans le formulaire

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';
import { marriageCertificateSchema } from '@/schemas/marriage-certificate';
import { generateReference } from '@/lib/utils';
import { generateClientReference } from '@/lib/client-reference';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';

const embedSubmitSchema = z.object({
  partner: z.string(),
  paymentMode: z.enum(['subscription', 'one_time']),
  subscriptionConsent: z.boolean().optional(),
  pricingCode: z.string().optional(),
  gclid: z.string().optional(),
  data: marriageCertificateSchema,
});

// POST /api/embed/acte-mariage
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rl = checkRateLimit(RATE_LIMITS.embed, ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Trop de requetes. Veuillez reessayer plus tard.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = embedSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { partner, paymentMode, pricingCode, gclid, data } = parsed.data;

    // Les coordonnees sont obligatoires en mode embed
    if (!data.email) {
      return NextResponse.json(
        { error: 'Coordonnees requises' },
        { status: 400 }
      );
    }

    const email = data.email;
    const phone = data.telephone;
    const firstName = data.firstName;
    const lastName = data.lastName;

    // Trouver ou creer l'utilisateur par email
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Mot de passe temporaire crypto-safe
      const tempPassword = crypto.randomBytes(24).toString('base64url');
      const passwordHash = await bcrypt.hash(tempPassword, 12);

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

    // SECURITE : en mode embed (pas d'authentification), on ne consomme jamais
    // les credits d'abonnement automatiquement. Un attaquant pourrait sinon
    // drainer les credits d'un abonne en connaissant juste son email.

    // Generer la reference de la demarche
    const count = await prisma.process.count();
    const reference = generateReference('DEM', count + 1);

    const basePrice = 1490; // 14,90 EUR en centimes

    // Creer la demarche en attente de paiement
    const process = await prisma.process.create({
      data: {
        reference,
        userId: user.id,
        type: 'CIVIL_STATUS_MARRIAGE',
        status: 'PENDING_PAYMENT',
        amountCents: basePrice,
        data: data as any,
        partner,
        pricingCode: pricingCode ?? null,
        source: 'embed',
        gclid: gclid ?? null,
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
    console.error('Erreur embed acte-mariage:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la demarche' },
      { status: 500 }
    );
  }
}
