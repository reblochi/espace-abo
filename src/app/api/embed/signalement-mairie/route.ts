// API Route publique - Soumission signalement mairie via widget embed (gratuit)
// Pas d'authentification requise. Accepte multipart/form-data avec fichiers.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { generateReference } from '@/lib/utils';
import { generateClientReference } from '@/lib/client-reference';
import { generateAutoLoginToken } from '@/lib/auto-login';
import { SIGNALEMENT_CATEGORIES } from '@/schemas/signalement-mairie';
import { sendEmail } from '@/lib/email';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';
import { addArrondissementInsee } from '@/lib/insee';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const VALID_CATEGORIES = SIGNALEMENT_CATEGORIES.map((c) => c.value) as readonly string[];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function getMairieEmail(zipCode: string): Promise<{ email: string | null; nom: string | null; formulaire: string | null }> {
  try {
    const geoRes = await fetch(
      `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(zipCode)}&fields=code&format=json`
    );
    if (!geoRes.ok) return { email: null, nom: null, formulaire: null };

    const communes: { code: string }[] = await geoRes.json();
    if (communes.length === 0) return { email: null, nom: null, formulaire: null };

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
    if (!res.ok) return { email: null, nom: null, formulaire: null };

    const data = await res.json();
    const records: Array<{ nom?: string; adresse_courriel?: string; formulaire_contact?: string }> = data.results || [];

    for (const r of records) {
      if (r.adresse_courriel) {
        return { email: r.adresse_courriel, nom: r.nom || null, formulaire: r.formulaire_contact || null };
      }
    }
    const first = records[0];
    return { email: null, nom: first?.nom || null, formulaire: first?.formulaire_contact || null };
  } catch {
    return { email: null, nom: null, formulaire: null };
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(RATE_LIMITS.embed, ip);
    if (!rl.success) {
      return NextResponse.json({ error: 'Trop de requetes. Veuillez reessayer plus tard.' }, { status: 429 });
    }

    const formData = await request.formData();

    const partner = (formData.get('partner') as string) || 'embed';
    const category = (formData.get('category') as string) || '';
    const description = (formData.get('description') as string) || '';
    const adresse = (formData.get('adresse') as string) || '';
    const zipCode = (formData.get('zipCode') as string) || '';
    const city = (formData.get('city') as string) || '';
    const email = (formData.get('email') as string) || '';
    const firstName = (formData.get('firstName') as string) || '';
    const lastName = (formData.get('lastName') as string) || '';
    const phone = (formData.get('telephone') as string) || '';
    const gclid = (formData.get('gclid') as string) || '';
    const mairieNameFromPartner = (formData.get('mairieName') as string) || '';

    // Validation
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Categorie invalide' }, { status: 400 });
    }
    if (description.length < 10) {
      return NextResponse.json({ error: 'Description trop courte (10 caracteres minimum)' }, { status: 400 });
    }
    if (!/^[0-9]{5}$/.test(zipCode)) {
      return NextResponse.json({ error: 'Code postal invalide' }, { status: 400 });
    }
    if (!city || city.length < 1) {
      return NextResponse.json({ error: 'Commune requise' }, { status: 400 });
    }
    if (!firstName || firstName.length < 2) {
      return NextResponse.json({ error: 'Prenom requis (2 caracteres minimum)' }, { status: 400 });
    }
    if (!lastName || lastName.length < 2) {
      return NextResponse.json({ error: 'Nom requis (2 caracteres minimum)' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    // Recuperer fichiers
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'files' && value instanceof File && value.size > 0) {
        files.push(value);
      }
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} fichiers autorises` }, { status: 400 });
    }
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `Le fichier "${file.name}" depasse 10 Mo` }, { status: 400 });
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: `Format non autorise pour "${file.name}". JPEG, PNG, WebP ou PDF.` }, { status: 400 });
      }
    }

    // Trouver ou creer l'utilisateur par email
    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;
    if (!user) {
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
          zipCode,
          city,
          passwordHash,
          updatedAt: new Date(),
        },
      });
      isNewUser = true;
    } else if (!user.firstName || !user.lastName) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: user.firstName || firstName,
          lastName: user.lastName || lastName,
          phone: user.phone || phone || null,
          zipCode: user.zipCode || zipCode,
          city: user.city || city,
        },
      });
    }

    // Resoudre l'email mairie via API service-public si pas fourni par le partenaire
    const { email: mairieEmail, nom: mairieNameLookup, formulaire: mairieFormulaire } =
      await getMairieEmail(zipCode);
    const mairieName = mairieNameFromPartner || mairieNameLookup || `Mairie ${city}`;

    const categoryLabel = SIGNALEMENT_CATEGORIES.find((c) => c.value === category)?.label || category;

    // Creer la demarche (gratuite -> directement PAID)
    const count = await prisma.process.count();
    const reference = generateReference('DEM', count + 1);

    const processData = {
      category,
      categoryLabel,
      zipCode,
      city,
      adresse,
      description,
      requesterFirstName: firstName,
      requesterLastName: lastName,
      email,
      telephone: phone || '',
      mairieName,
      mairieEmail,
    };

    const newProcess = await prisma.process.create({
      data: {
        reference,
        userId: user.id,
        type: 'SIGNALEMENT_MAIRIE',
        status: 'PAID',
        amountCents: 0,
        taxesCents: 0,
        serviceFeesCents: 0,
        isFromSubscription: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: processData as any,
        mandatoryFileTypes: [],
        partner,
        source: 'embed',
        gclid: gclid || null,
        paidAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.processStatusHistory.create({
      data: {
        processId: newProcess.id,
        fromStatus: 'DRAFT',
        toStatus: 'PAID',
        reason: 'Signalement enregistre via widget embed',
        createdBy: user.id,
      },
    });

    // Upload des fichiers (Supabase Storage) + attache au Process
    const storageConfigured = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const uploadedFilesForEmail: Array<{ filename: string; content: Buffer }> = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      uploadedFilesForEmail.push({ filename: file.name, content: buffer });

      if (storageConfigured) {
        try {
          const { uploadToStorage } = await import('@/lib/storage');
          const { fileName, storageUrl } = await uploadToStorage(buffer, file.name, file.type, 'signalements');
          await prisma.processFile.create({
            data: {
              processId: newProcess.id,
              userId: user.id,
              fileType: 'AUTRE',
              originalName: file.name,
              fileName,
              storageKey: fileName,
              storageUrl,
              mimeType: file.type,
              size: file.size,
            },
          });
        } catch (err) {
          console.error('Erreur upload fichier:', err);
        }
      }
    }

    // Email a la mairie (best-effort)
    const userName = `${firstName} ${lastName}`.trim() || 'Citoyen';
    const lieu = adresse || `${city} (${zipCode})`;
    const dateStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const templateData = {
      category: escapeHtml(categoryLabel),
      lieu: escapeHtml(lieu),
      description: escapeHtml(description).replace(/\n/g, '<br>'),
      userName: escapeHtml(userName),
      userEmail: escapeHtml(email),
      date: dateStr,
      nbPiecesJointes: uploadedFilesForEmail.length > 0 ? `${uploadedFilesForEmail.length}` : '',
    };

    let actuallySent = false;
    if (mairieEmail) {
      try {
        await sendEmail({
          to: mairieEmail,
          template: 'signalement-mairie',
          data: templateData,
          attachments: uploadedFilesForEmail,
        });
        actuallySent = true;
      } catch (err) {
        console.error('Erreur envoi email mairie:', err);
      }
    }

    // Email de confirmation au user (avec auto-login)
    try {
      await sendEmail({
        to: email,
        template: 'signalement-confirmation',
        data: {
          ...templateData,
          sentToMairie: actuallySent ? 'true' : 'false',
          mairieName: escapeHtml(mairieName),
          mairieFormulaire: !actuallySent && mairieFormulaire ? escapeHtml(mairieFormulaire) : '',
        },
        userId: user.id,
      });
    } catch (err) {
      console.error('Erreur envoi email confirmation:', err);
    }

    if (isNewUser) {
      sendEmail({
        to: email,
        subject: 'Bienvenue sur France Guichet !',
        template: 'welcome',
        data: { firstName },
        userId: user.id,
      }).catch((err) => console.error('Erreur envoi email bienvenue:', err));
    }

    const autoLoginToken = generateAutoLoginToken(user.id);
    const callbackUrl = '/espace-membre/signalements';
    const confirmationUrl = `${request.nextUrl.origin}/api/auth/auto-login?token=${encodeURIComponent(autoLoginToken)}&callbackUrl=${encodeURIComponent(callbackUrl)}`;

    return NextResponse.json({
      success: true,
      reference: newProcess.reference,
      sentToMairie: actuallySent,
      mairieName,
      autoLoginToken,
      url: confirmationUrl,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Erreur embed signalement-mairie:', msg);
    return NextResponse.json(
      { error: 'Erreur lors de la creation du signalement' },
      { status: 500 }
    );
  }
}
