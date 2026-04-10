// API Route publique - Soumission carte d'identite via widget embed
// Pas d'authentification requise, les coordonnees sont collectees dans le formulaire

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';
import { identityCardSchema } from '@/schemas/identity-card';
import { generateReference } from '@/lib/utils';
import { generateClientReference } from '@/lib/client-reference';
import { calculateStampTax } from '@/types/identity-card';
import { PROCESS_TYPES_CONFIG } from '@/lib/process-types';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';

const embedSubmitSchema = z.object({
  partner: z.string(),
  paymentMode: z.enum(['subscription', 'one_time']),
  subscriptionConsent: z.boolean().optional(),
  pricingCode: z.string().optional(),
  gclid: z.string().optional(),
  data: identityCardSchema,
});

// POST /api/embed/carte-identite
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
    if (!data.contact) {
      return NextResponse.json(
        { error: 'Coordonnees requises' },
        { status: 400 }
      );
    }

    const { email, firstName, lastName, phone } = data.contact;

    // Trouver l'utilisateur par email OU par telephone
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user && phone) {
      const normalizedPhone = phone.replace(/[\s\-.]/g, '');
      user = await prisma.user.findFirst({ where: { phone: normalizedPhone } });
    }

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

    const basePrice = PROCESS_TYPES_CONFIG.IDENTITY_CARD.basePrice;
    const stampTax = calculateStampTax(data.motif, data.deliveryAddress?.zipCode);
    const totalPrice = basePrice + stampTax;

    // Creer la demarche en attente de paiement
    const process = await prisma.process.create({
      data: {
        reference,
        userId: user.id,
        type: 'IDENTITY_CARD',
        status: 'PENDING_PAYMENT',
        amountCents: totalPrice,
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
    console.error('Erreur embed carte-identite:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la demarche' },
      { status: 500 }
    );
  }
}
