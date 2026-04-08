// POST /api/processes/public
// Endpoint public (sans auth) pour creer une demarche gratuite + compte utilisateur.
// Retourne un token d'auto-login pour connecter automatiquement le client.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { generateReference } from '@/lib/utils';
import { generateClientReference } from '@/lib/client-reference';
import { generateAutoLoginToken } from '@/lib/auto-login';
import { PROCESS_TYPES_CONFIG } from '@/lib/process-types';
import { sendEmail } from '@/lib/email';
import type { ProcessType } from '@/types';

const publicProcessSchema = z.object({
  type: z.string(),
  data: z.record(z.unknown()),
  source: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = publicProcessSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type, data, source } = parsed.data;

    // Verifier que le type existe et est gratuit
    const processConfig = PROCESS_TYPES_CONFIG[type as ProcessType];
    if (!processConfig) {
      return NextResponse.json({ error: 'Type de demarche invalide' }, { status: 400 });
    }
    if (processConfig.basePrice > 0) {
      return NextResponse.json({ error: 'Cette demarche n\'est pas gratuite' }, { status: 400 });
    }

    // Extraire l'email et le nom depuis les donnees du formulaire
    const email = data.email as string;
    const firstName = data.requesterFirstName as string;
    const lastName = data.requesterLastName as string;
    const phone = (data.telephone as string) || null;

    if (!email || !firstName || !lastName) {
      return NextResponse.json({ error: 'Email, nom et prenom requis' }, { status: 400 });
    }

    // Verifier si deja connecte
    const session = await getServerSession(authOptions);
    let userId = session?.user?.id;
    let isNewUser = false;

    if (!userId) {
      // Trouver ou creer l'utilisateur par email
      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        // Creer un compte avec un mot de passe temporaire
        const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        const clientRef = await generateClientReference();
        user = await prisma.user.create({
          data: {
            reference: clientRef,
            email,
            firstName,
            lastName,
            phone,
            passwordHash,
            updatedAt: new Date(),
          },
        });
        isNewUser = true;
      } else {
        // Mettre a jour les infos si manquantes
        if (!user.firstName || !user.lastName) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              firstName: user.firstName || firstName,
              lastName: user.lastName || lastName,
              phone: user.phone || phone,
            },
          });
        }
      }

      userId = user.id;
    }

    // Generer reference
    const count = await prisma.process.count();
    const reference = generateReference('DEM', count + 1);

    // Creer la demarche (gratuite -> directement PAID)
    const newProcess = await prisma.process.create({
      data: {
        reference,
        userId,
        type: type as ProcessType,
        status: 'PAID',
        amountCents: 0,
        taxesCents: 0,
        serviceFeesCents: 0,
        isFromSubscription: true, // Marque comme "gratuit/inclus"
        data: data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        mandatoryFileTypes: [],
        source: source ?? null,
        paidAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Historique de statut
    await prisma.processStatusHistory.create({
      data: {
        processId: newProcess.id,
        fromStatus: 'DRAFT',
        toStatus: 'PAID',
        reason: 'Demande enregistree',
        createdBy: userId,
      },
    });

    // Generer le token d'auto-login (seulement si pas deja connecte)
    let autoLoginToken: string | null = null;
    if (!session?.user?.id) {
      autoLoginToken = generateAutoLoginToken(userId);
    }

    // Email de confirmation
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await sendEmail({
        to: user.email,
        subject: `Confirmation de votre signalement ${reference}`,
        template: 'process-confirmation',
        data: {
          firstName: user.firstName,
          reference,
          type,
          isFromSubscription: true,
        },
      }).catch((err) => console.error('Erreur envoi email confirmation:', err));

      // Email de bienvenue si nouveau compte
      if (isNewUser) {
        await sendEmail({
          to: user.email,
          subject: 'Bienvenue sur France Guichet !',
          template: 'welcome',
          data: { firstName: user.firstName },
        }).catch((err) => console.error('Erreur envoi email bienvenue:', err));
      }
    }

    return NextResponse.json({
      process: {
        id: newProcess.id,
        reference: newProcess.reference,
        status: newProcess.status,
      },
      autoLoginToken,
      isNewUser,
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur creation demarche publique:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la creation de la demarche' },
      { status: 500 }
    );
  }
}
