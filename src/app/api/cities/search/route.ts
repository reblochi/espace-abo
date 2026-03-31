// API Route - Recherche de communes de naissance
// Source unique : API Advercity (table city) — pas de fallback geo.api.gouv.fr
// car les IDs doivent correspondre a la base Advercity (id_mairie)

import { NextRequest, NextResponse } from 'next/server';

interface CityResult {
  id: number;
  name: string;
  postal_code: string;
  department_code: string;
}

// Normalise les abreviations courantes dans les noms de villes
// St/Ste → Saint/Sainte
function normalizeCityQuery(input: string): string {
  let s = input.trim();
  s = s.replace(/\bstes\b/gi, 'Saintes');
  s = s.replace(/\bste\b/gi, 'Sainte');
  s = s.replace(/\bst\b/gi, 'Saint');
  return s;
}

async function searchCitiesAdvercity(query: string, limit: number): Promise<CityResult[]> {
  const apiUrl = process.env.ADVERCITY_API_URL;
  const token = process.env.ADVERCITY_API_TOKEN;
  if (!apiUrl) return [];

  const url = new URL('/api/external/cities', apiUrl);
  url.searchParams.set('q', query.trim());
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString(), {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) return [];
  return response.json();
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
    const normalized = normalizeCityQuery(query);

    const cities = await searchCitiesAdvercity(normalized, safeLimit);
    return NextResponse.json(cities);
  } catch (error) {
    console.error('Erreur recherche communes:', error);
    return NextResponse.json([]);
  }
}
