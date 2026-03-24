// API Route - Signalement citoyen
// Envoie un email a la mairie de la commune du user

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { sendRawEmail } from '@/lib/email';
import { addArrondissementInsee } from '@/lib/insee';
import { z } from 'zod';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const signalementSchema = z.object({
  category: z.string().min(1, 'Categorie requise'),
  description: z.string().min(10, 'Description trop courte (min 10 caracteres)'),
  adresse: z.string().optional(),
});

// Cache email + nom mairie par code postal
const mairieCache = new Map<string, { email: string | null; nom: string | null }>();

async function getMairieEmail(zipCode: string): Promise<{ email: string | null; nom: string | null }> {
  if (mairieCache.has(zipCode)) {
    return mairieCache.get(zipCode)!;
  }

  try {
    // Resoudre code INSEE
    const geoRes = await fetch(
      `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(zipCode)}&fields=code&format=json`
    );
    if (!geoRes.ok) return { email: null, nom: null };

    const communes: { code: string }[] = await geoRes.json();
    if (communes.length === 0) return { email: null, nom: null };

    const codeInsee = communes.map((c) => c.code);
    addArrondissementInsee(zipCode, codeInsee);

    const whereInsee = [...new Set(codeInsee)].map((c) => `code_insee_commune='${c}'`).join(' or ');

    const url = new URL(
      'https://api-lannuaire.service-public.gouv.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records'
    );
    url.searchParams.set('where', `(${whereInsee}) and search(pivot,'mairie')`);
    url.searchParams.set('limit', '5');
    url.searchParams.set('select', 'nom,adresse_courriel,formulaire_contact');

    const res = await fetch(url.toString());
    if (!res.ok) return { email: null, nom: null };

    const data = await res.json();
    const records: any[] = data.results || [];

    for (const r of records) {
      if (r.adresse_courriel) {
        const result = { email: r.adresse_courriel, nom: r.nom || null };
        mairieCache.set(zipCode, result);
        return result;
      }
    }

    const result = { email: null, nom: records[0]?.nom || null };
    mairieCache.set(zipCode, result);
    return result;
  } catch {
    return { email: null, nom: null };
  }
}

// GET /api/signalements - Info mairie (email disponible ou non)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { zipCode: true },
    });

    if (!user?.zipCode) {
      return NextResponse.json({ mairieEmail: null, mairieName: null, zipCode: null });
    }

    const { email, nom } = await getMairieEmail(user.zipCode);

    return NextResponse.json({
      mairieEmail: email,
      mairieName: nom,
      zipCode: user.zipCode,
    });
  } catch (error) {
    console.error('Erreur signalements GET:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/signalements - Envoyer un signalement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = signalementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { category, description, adresse } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, firstName: true, lastName: true, zipCode: true, city: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    if (!user.zipCode) {
      return NextResponse.json(
        { error: 'Code postal non renseigne dans votre profil' },
        { status: 400 }
      );
    }

    const { email: mairieEmail, nom: mairieName } = await getMairieEmail(user.zipCode);

    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Citoyen';
    const lieu = adresse || user.city || user.zipCode;
    const date = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const safeCategory = escapeHtml(category);
    const safeLieu = escapeHtml(lieu);
    const safeDescription = escapeHtml(description).replace(/\n/g, '<br>');
    const safeUserName = escapeHtml(userName);
    const safeEmail = escapeHtml(user.email);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Signalement citoyen</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb; width: 140px;">Categorie</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${safeCategory}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Localisation</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${safeLieu}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Description</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${safeDescription}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Signale par</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${safeUserName} (${safeEmail})</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Date</td>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${date}</td>
          </tr>
        </table>
        <p style="color: #6b7280; font-size: 12px;">
          Ce signalement a ete envoye via franceguichet.fr - Service d'Aide aux Formalites
        </p>
      </div>
    `;

    const subject = `[Signalement] ${category} - ${lieu}`;
    let sentTo: string | null = null;

    // Envoyer a la mairie si email disponible
    if (mairieEmail) {
      try {
        await sendRawEmail(mairieEmail, subject, emailHtml);
        sentTo = mairieEmail;
      } catch (e) {
        console.error('Erreur envoi email mairie:', e);
      }
    }

    // Copie au user
    try {
      await sendRawEmail(
        user.email,
        `Votre signalement : ${category}`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">Votre signalement a ete enregistre</h2>
            <p>Bonjour ${userName},</p>
            <p>Votre signalement a bien ete ${sentTo ? `transmis a <strong>${mairieName || 'votre mairie'}</strong>` : 'enregistre'}.</p>
            ${emailHtml}
          </div>
        `
      );
    } catch (e) {
      console.error('Erreur envoi copie user:', e);
    }

    return NextResponse.json({
      success: true,
      sentToMairie: !!sentTo,
      mairieName,
    });
  } catch (error) {
    console.error('Erreur signalements POST:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du signalement' },
      { status: 500 }
    );
  }
}
