// API Route - Services publics proches du client
// Utilise geo.api.gouv.fr pour convertir code postal -> code INSEE
// Puis api-lannuaire.service-public.gouv.fr pour lister les services

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { addArrondissementInsee } from '@/lib/insee';

const SERVICE_TYPES = ['mairie', 'france_services', 'caf', 'cpam', 'point_accueil_numerique'] as const;

type ServiceType = (typeof SERVICE_TYPES)[number];

const SERVICE_LABELS: Record<ServiceType, string> = {
  mairie: 'Mairie',
  france_services: 'Maison France Services',
  caf: 'CAF',
  cpam: 'CPAM',
  point_accueil_numerique: 'Point numerique',
};

export interface ServicePublic {
  id: string;
  type: ServiceType;
  typeLabel: string;
  nom: string;
  adresse: string;
  codePostal: string;
  commune: string;
  telephone: string | null;
  email: string | null;
  horaires: PlageOuverture[] | null;
  siteInternet: string | null;
  urlServicePublic: string | null;
}

interface PlageOuverture {
  jourDebut: string;
  jourFin: string;
  heureDebut1: string;
  heureFin1: string;
  heureDebut2: string | null;
  heureFin2: string | null;
}

// GET /api/services-publics
function parseRecord(r: any): ServicePublic | null {
  let serviceType: ServiceType = 'mairie';
  try {
    const pivots = typeof r.pivot === 'string' ? JSON.parse(r.pivot) : r.pivot;
    if (Array.isArray(pivots) && pivots.length > 0) {
      const found = SERVICE_TYPES.find((t) => pivots[0].type_service_local === t);
      if (found) serviceType = found;
    }
  } catch {}

  let adresse = '';
  let codePostal = '';
  let commune = '';
  try {
    const adresses = typeof r.adresse === 'string' ? JSON.parse(r.adresse) : r.adresse;
    if (Array.isArray(adresses) && adresses.length > 0) {
      const a = adresses[0];
      adresse = a.numero_voie || '';
      codePostal = a.code_postal || '';
      commune = a.nom_commune || '';
    }
  } catch {}

  let telephone: string | null = null;
  try {
    const tels = typeof r.telephone === 'string' ? JSON.parse(r.telephone) : r.telephone;
    if (Array.isArray(tels) && tels.length > 0) {
      telephone = tels[0].valeur || null;
    }
  } catch {}

  let siteInternet: string | null = null;
  try {
    const sites =
      typeof r.site_internet === 'string' ? JSON.parse(r.site_internet) : r.site_internet;
    if (Array.isArray(sites) && sites.length > 0) {
      siteInternet = sites[0].valeur || null;
    }
  } catch {}

  let horaires: PlageOuverture[] | null = null;
  try {
    const plages =
      typeof r.plage_ouverture === 'string' ? JSON.parse(r.plage_ouverture) : r.plage_ouverture;
    if (Array.isArray(plages) && plages.length > 0) {
      horaires = plages.map((p: any) => ({
        jourDebut: p.nom_jour_debut || '',
        jourFin: p.nom_jour_fin || '',
        heureDebut1: p.valeur_heure_debut_1 || '',
        heureFin1: p.valeur_heure_fin_1 || '',
        heureDebut2: p.valeur_heure_debut_2 || null,
        heureFin2: p.valeur_heure_fin_2 || null,
      }));
    }
  } catch {}

  return {
    id: r.id,
    type: serviceType,
    typeLabel: SERVICE_LABELS[serviceType],
    nom: r.nom || '',
    adresse,
    codePostal,
    commune,
    telephone,
    email: r.adresse_courriel || null,
    horaires,
    siteInternet,
    urlServicePublic: r.url_service_public || null,
  };
}

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
      return NextResponse.json(
        { error: 'Code postal non renseigne dans votre profil' },
        { status: 400 }
      );
    }

    // 1. Convertir code postal -> code(s) INSEE via geo.api.gouv.fr
    const geoRes = await fetch(
      `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(user.zipCode)}&fields=code&format=json`,
      { next: { revalidate: 86400 } } // cache 24h
    );

    if (!geoRes.ok) {
      return NextResponse.json(
        { error: 'Erreur lors de la resolution du code postal' },
        { status: 502 }
      );
    }

    const communes: { code: string }[] = await geoRes.json();

    if (communes.length === 0) {
      return NextResponse.json(
        { error: 'Aucune commune trouvee pour ce code postal' },
        { status: 404 }
      );
    }

    // Prendre tous les codes INSEE (un code postal peut couvrir plusieurs communes)
    const codeInsee = communes.map((c) => c.code);

    // Pour Paris/Lyon/Marseille, les services sont enregistres par arrondissement
    addArrondissementInsee(user.zipCode, codeInsee);

    // 2. Interroger l'annuaire pour chaque type de service
    const whereInsee = [...new Set(codeInsee)].map((c) => `code_insee_commune='${c}'`).join(' or ');
    const wherePivot = SERVICE_TYPES.map((t) => `search(pivot,'${t}')`).join(' or ');
    const where = `(${whereInsee}) and (${wherePivot})`;

    const annuaireUrl = new URL(
      'https://api-lannuaire.service-public.gouv.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records'
    );
    annuaireUrl.searchParams.set('where', where);
    annuaireUrl.searchParams.set('limit', '20');
    annuaireUrl.searchParams.set(
      'select',
      'id,nom,pivot,adresse,telephone,adresse_courriel,plage_ouverture,site_internet,url_service_public'
    );

    const annuaireRes = await fetch(annuaireUrl.toString(), {
      next: { revalidate: 3600 }, // cache 1h
    });

    if (!annuaireRes.ok) {
      return NextResponse.json(
        { error: 'Erreur lors de la recuperation des services publics' },
        { status: 502 }
      );
    }

    const annuaireData = await annuaireRes.json();
    const records: any[] = annuaireData.results || [];

    // 3. Transformer les resultats
    const services: ServicePublic[] = records.map(parseRecord).filter(Boolean) as ServicePublic[];

    // Trier : un service par type, privilegier le premier trouve
    const byType = new Map<ServiceType, ServicePublic>();
    for (const s of services) {
      if (!byType.has(s.type)) {
        byType.set(s.type, s);
      }
    }

    // Fallback : pour les types manquants, chercher dans les communes voisines
    const missingTypes = SERVICE_TYPES.filter((t) => !byType.has(t));
    if (missingTypes.length > 0 && codeInsee.length > 0) {
      try {
        const voisinesRes = await fetch(
          `https://geo.api.gouv.fr/communes/${codeInsee[0]}/voisines?fields=code&format=json`,
          { next: { revalidate: 86400 } }
        );
        if (voisinesRes.ok) {
          const voisines: { code: string }[] = await voisinesRes.json();
          const voisinesInsee = voisines.map((v) => v.code).slice(0, 10);

          if (voisinesInsee.length > 0) {
            const whereVoisines = voisinesInsee.map((c) => `code_insee_commune='${c}'`).join(' or ');
            const whereMissing = missingTypes.map((t) => `search(pivot,'${t}')`).join(' or ');
            const whereExtra = `(${whereVoisines}) and (${whereMissing})`;

            const extraUrl = new URL(
              'https://api-lannuaire.service-public.gouv.fr/api/explore/v2.1/catalog/datasets/api-lannuaire-administration/records'
            );
            extraUrl.searchParams.set('where', whereExtra);
            extraUrl.searchParams.set('limit', '20');
            extraUrl.searchParams.set(
              'select',
              'id,nom,pivot,adresse,telephone,adresse_courriel,plage_ouverture,site_internet,url_service_public'
            );

            const extraRes = await fetch(extraUrl.toString(), { next: { revalidate: 3600 } });
            if (extraRes.ok) {
              const extraData = await extraRes.json();
              const extraRecords: any[] = extraData.results || [];

              for (const r of extraRecords) {
                const parsed = parseRecord(r);
                if (parsed && !byType.has(parsed.type)) {
                  byType.set(parsed.type, parsed);
                }
              }
            }
          }
        }
      } catch {}
    }

    return NextResponse.json({
      services: Array.from(byType.values()),
      codePostal: user.zipCode,
    });
  } catch (error) {
    console.error('Erreur services-publics:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation des services publics' },
      { status: 500 }
    );
  }
}
