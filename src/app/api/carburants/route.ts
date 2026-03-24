// API Route - Prix des carburants proches du client
// Utilise data.economie.gouv.fr (flux instantane v2)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

const FUEL_TYPES = ['gazole', 'sp95', 'sp98', 'e10', 'e85', 'gplc'] as const;
type FuelType = (typeof FUEL_TYPES)[number];

const FUEL_LABELS: Record<FuelType, string> = {
  gazole: 'Gazole',
  sp95: 'SP95',
  sp98: 'SP98',
  e10: 'E10',
  e85: 'E85',
  gplc: 'GPLc',
};

export interface Station {
  id: number;
  adresse: string;
  ville: string;
  cp: string;
  automate24h: boolean;
  carburants: {
    type: FuelType;
    label: string;
    prix: number;
  }[];
}

interface MeilleurPrix {
  prix: number;
  station: string;
  adresse: string;
}

export interface CarburantsResponse {
  stations: Station[];
  codePostal: string;
  meilleursPrix: Record<string, MeilleurPrix>;
}

// GET /api/carburants
export async function GET(request: NextRequest) {
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

    const zipCode = user.zipCode;
    const deptCode = zipCode.slice(0, 2);

    // Essayer par code postal d'abord, puis par departement si pas de resultats
    let stations = await fetchStations(`refine=cp:${zipCode}`);

    if (stations.length === 0) {
      // Pour Paris/Lyon/Marseille ou petites communes, elargir au departement
      stations = await fetchStations(`refine=code_departement:${deptCode}`);
    }

    // Limiter a 10 stations max
    stations = stations.slice(0, 10);

    // Calculer les meilleurs prix par type de carburant
    const meilleursPrix: Record<string, MeilleurPrix> = {};
    for (const fuel of FUEL_TYPES) {
      let bestPrix = Infinity;
      let bestStation = '';
      let bestAdresse = '';

      for (const station of stations) {
        const carb = station.carburants.find((c) => c.type === fuel);
        if (carb && carb.prix < bestPrix) {
          bestPrix = carb.prix;
          bestStation = station.ville;
          bestAdresse = station.adresse;
        }
      }

      if (bestPrix < Infinity) {
        meilleursPrix[fuel] = { prix: bestPrix, station: bestStation, adresse: bestAdresse };
      }
    }

    return NextResponse.json({
      stations,
      codePostal: zipCode,
      meilleursPrix,
    } satisfies CarburantsResponse);
  } catch (error) {
    console.error('Erreur carburants:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation des prix' },
      { status: 500 }
    );
  }
}

async function fetchStations(filter: string): Promise<Station[]> {
  const url = new URL(
    'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records'
  );
  url.searchParams.set(
    'select',
    'id,adresse,ville,cp,gazole_prix,sp95_prix,sp98_prix,e10_prix,e85_prix,gplc_prix,carburants_disponibles,horaires_automate_24_24'
  );
  url.searchParams.set('limit', '15');
  url.searchParams.set('order_by', 'e10_prix asc');

  // Ajouter le filtre via l'URL brute (refine utilise la syntaxe key:value)
  const fullUrl = `${url.toString()}&${filter}`;

  const res = await fetch(fullUrl, { next: { revalidate: 1800 } }); // cache 30min
  if (!res.ok) return [];

  const data = await res.json();
  const records: any[] = data.results || [];

  return records.map((r) => {
    const carburants: Station['carburants'] = [];

    for (const fuel of FUEL_TYPES) {
      const prix = r[`${fuel}_prix`];
      if (prix != null && prix > 0) {
        carburants.push({
          type: fuel,
          label: FUEL_LABELS[fuel],
          prix,
        });
      }
    }

    return {
      id: r.id,
      adresse: r.adresse || '',
      ville: r.ville || '',
      cp: r.cp || '',
      automate24h: r.horaires_automate_24_24 === 'Oui',
      carburants,
    };
  });
}
