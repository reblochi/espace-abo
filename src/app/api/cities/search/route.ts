// API Route - Recherche de communes
// Source de verite : API Advercity (table city)
// Fallback : geo.api.gouv.fr (IDs differents, a utiliser uniquement si API Advercity indisponible)

import { NextRequest, NextResponse } from 'next/server';
import { searchCities as searchCitiesAdvercity } from '@/lib/advercity';

interface GeoApiCommune {
  code: string;
  nom: string;
  codesPostaux: string[];
  codeDepartement: string;
  population?: number;
}

async function searchCitiesGeoApi(query: string, limit: number) {
  const url = new URL('https://geo.api.gouv.fr/communes');
  url.searchParams.set('nom', query);
  url.searchParams.set('fields', 'code,nom,codesPostaux,codeDepartement,population');
  url.searchParams.set('boost', 'population');
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) return null;

  const communes: GeoApiCommune[] = await response.json();

  return communes.map((c) => ({
    id: parseInt(c.code, 10) || 0,
    name: c.nom,
    postal_code: c.codesPostaux[0] || '',
    department_code: c.codeDepartement,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const safeLimit = Math.min(limit, 20);

    // Essayer API Advercity d'abord (source de verite, bons IDs)
    try {
      const cities = await searchCitiesAdvercity(query, safeLimit);
      if (cities && cities.length > 0) {
        return NextResponse.json(cities);
      }
    } catch {
      // Fallback silencieux vers geo.api.gouv.fr
    }

    // Fallback: geo.api.gouv.fr (attention: IDs = codes INSEE, pas IDs Advercity)
    try {
      const cities = await searchCitiesGeoApi(query, safeLimit);
      if (cities && cities.length > 0) {
        return NextResponse.json(cities);
      }
    } catch {
      // Les deux APIs ont echoue
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Erreur recherche communes:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500 }
    );
  }
}
