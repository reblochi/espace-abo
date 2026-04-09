// API Route - Signalement citoyen
// GET: info mairie + historique signalements
// POST: creer un signalement avec pieces jointes optionnelles

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { addArrondissementInsee } from '@/lib/insee';

// Import dynamique pour eviter le crash si R2 n'est pas configure
async function storageUpload(buffer: Buffer, name: string, type: string, folder: string) {
  const { uploadToStorage } = await import('@/lib/storage');
  return uploadToStorage(buffer, name, type, folder);
}
async function storageSignedUrl(fileName: string) {
  const { getSignedDownloadUrl } = await import('@/lib/storage');
  return getSignedDownloadUrl(fileName);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// Cache email + nom mairie par code postal
const mairieCache = new Map<string, { email: string | null; nom: string | null; formulaire: string | null }>();

async function getMairieInfo(zipCode: string): Promise<{ email: string | null; nom: string | null; formulaire: string | null }> {
  if (mairieCache.has(zipCode)) {
    return mairieCache.get(zipCode)!;
  }

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
    const records: any[] = data.results || [];

    // Chercher un enregistrement avec email
    for (const r of records) {
      if (r.adresse_courriel) {
        const result = { email: r.adresse_courriel, nom: r.nom || null, formulaire: r.formulaire_contact || null };
        mairieCache.set(zipCode, result);
        return result;
      }
    }

    // Pas d'email — prendre formulaire_contact si disponible
    const first = records[0];
    const result = {
      email: null,
      nom: first?.nom || null,
      formulaire: first?.formulaire_contact || null,
    };
    mairieCache.set(zipCode, result);
    return result;
  } catch {
    return { email: null, nom: null, formulaire: null };
  }
}

// GET /api/signalements - Info mairie + historique
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const history = searchParams.get('history');

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { zipCode: true },
    });

    if (!user?.zipCode) {
      return NextResponse.json({ mairieEmail: null, mairieName: null, mairieFormulaire: null, zipCode: null, signalements: [] });
    }

    const { email, nom, formulaire } = await getMairieInfo(user.zipCode);

    // Si demande d'historique
    if (history === '1') {
      // Anciens signalements (modele Signalement)
      const signalements = await prisma.signalement.findMany({
        where: { userId: session.user.id },
        include: { files: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Generer des URLs signees pour les fichiers
      const withUrls = await Promise.all(
        signalements.map(async (s) => ({
          ...s,
          files: await Promise.all(
            s.files.map(async (f) => ({
              ...f,
              url: await storageSignedUrl(f.fileName).catch(() => null),
            }))
          ),
        }))
      );

      // Nouveaux signalements (demarche Process SIGNALEMENT_MAIRIE)
      const processSignalements = await prisma.process.findMany({
        where: { userId: session.user.id, type: 'SIGNALEMENT_MAIRIE' },
        include: { files: { where: { deleted: false } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Convertir les Process en format Signalement pour l'affichage unifie
      const processAsSignalements = processSignalements.map((p) => {
        const d = p.data as Record<string, unknown>;
        return {
          id: p.id,
          category: (d.categoryLabel as string) || (d.category as string) || 'Signalement',
          description: (d.description as string) || '',
          adresse: (d.adresse as string) || null,
          mairieName: (d.city as string) || null,
          sentToMairie: p.status !== 'DRAFT' && p.status !== 'CANCELED',
          files: p.files.map((f) => ({
            id: f.id,
            originalName: f.originalName,
            mimeType: f.mimeType,
            size: f.size,
            url: f.storageUrl || null,
          })),
          createdAt: p.createdAt.toISOString(),
          reference: p.reference,
          status: p.status,
          _source: 'process' as const,
        };
      });

      // Fusionner et trier par date decroissante
      const allSignalements = [
        ...withUrls.map((s) => ({ ...s, _source: 'signalement' as const })),
        ...processAsSignalements,
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return NextResponse.json({
        mairieEmail: email,
        mairieName: nom,
        mairieFormulaire: formulaire,
        zipCode: user.zipCode,
        signalements: allSignalements,
      });
    }

    return NextResponse.json({
      mairieEmail: email,
      mairieName: nom,
      mairieFormulaire: formulaire,
      zipCode: user.zipCode,
    });
  } catch (error) {
    console.error('Erreur signalements GET:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/signalements - Envoyer un signalement (FormData)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const formData = await request.formData();
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const adresse = formData.get('adresse') as string | null;

    // Validation
    if (!category || category.length < 1) {
      return NextResponse.json({ error: 'Categorie requise' }, { status: 400 });
    }
    if (!description || description.length < 10) {
      return NextResponse.json({ error: 'Description trop courte (min 10 caracteres)' }, { status: 400 });
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
        return NextResponse.json({ error: `Le fichier "${file.name}" depasse la taille maximale de 10 Mo` }, { status: 400 });
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: `Type de fichier non autorise : ${file.name}. Formats acceptes : JPEG, PNG, WebP, PDF` }, { status: 400 });
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, firstName: true, lastName: true, zipCode: true, city: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }
    if (!user.zipCode) {
      return NextResponse.json({ error: 'Code postal non renseigne dans votre profil' }, { status: 400 });
    }

    const { email: mairieEmail, nom: mairieName, formulaire: mairieFormulaire } = await getMairieInfo(user.zipCode);

    // Upload des fichiers sur R2 (skip si R2 non configure)
    const storageConfigured = !!process.env.R2_ACCOUNT_ID;
    const uploadedFiles: { originalName: string; fileName: string; mimeType: string; size: number; buffer: Buffer }[] = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (storageConfigured) {
        const { fileName } = await storageUpload(buffer, file.name, file.type, 'signalements');
        uploadedFiles.push({ originalName: file.name, fileName, mimeType: file.type, size: file.size, buffer });
      } else {
        // Pas de R2 : on garde le buffer pour l'email mais pas de stockage persistant
        uploadedFiles.push({ originalName: file.name, fileName: `signalements/${file.name}`, mimeType: file.type, size: file.size, buffer });
      }
    }

    // Persister en BDD
    const sentToMairie = !!mairieEmail;
    const signalement = await prisma.signalement.create({
      data: {
        userId: session.user.id,
        category,
        description,
        adresse: adresse || null,
        zipCode: user.zipCode,
        city: user.city,
        mairieName,
        mairieEmail,
        sentToMairie: false, // sera mis a jour apres envoi
        files: {
          create: uploadedFiles.map((f) => ({
            originalName: f.originalName,
            fileName: f.fileName,
            mimeType: f.mimeType,
            size: f.size,
          })),
        },
      },
    });

    // Donnees communes pour les templates
    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Citoyen';
    const lieu = adresse || user.city || user.zipCode;
    const date = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const templateData = {
      category: escapeHtml(category),
      lieu: escapeHtml(lieu),
      description: escapeHtml(description).replace(/\n/g, '<br>'),
      userName: escapeHtml(userName),
      userEmail: escapeHtml(user.email),
      date,
      nbPiecesJointes: uploadedFiles.length > 0 ? `${uploadedFiles.length}` : '',
    };

    const attachments = uploadedFiles.map((f) => ({ filename: f.originalName, content: f.buffer }));

    // Envoyer a la mairie si email disponible
    let actuallySent = false;
    if (mairieEmail) {
      try {
        await sendEmail({
          to: mairieEmail,
          template: 'signalement-mairie',
          data: templateData,
          attachments,
        });
        actuallySent = true;
      } catch (e) {
        console.error('Erreur envoi email mairie:', e);
      }
    }

    // Mettre a jour le statut d'envoi
    if (actuallySent) {
      await prisma.signalement.update({
        where: { id: signalement.id },
        data: { sentToMairie: true },
      });
    }

    // Copie au user
    try {
      await sendEmail({
        to: user.email,
        template: 'signalement-confirmation',
        data: {
          ...templateData,
          sentToMairie: actuallySent ? 'true' : 'false',
          mairieName: escapeHtml(mairieName || 'votre mairie'),
          mairieFormulaire: !actuallySent && mairieFormulaire ? escapeHtml(mairieFormulaire) : '',
        },
        userId: user.id,
      });
    } catch (e) {
      console.error('Erreur envoi copie user:', e);
    }

    return NextResponse.json({
      success: true,
      sentToMairie: actuallySent,
      mairieName,
      mairieFormulaire: !actuallySent ? mairieFormulaire : null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    console.error('Erreur signalements POST:', msg, stack);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du signalement", details: msg },
      { status: 500 }
    );
  }
}
