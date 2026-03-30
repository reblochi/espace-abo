// Endpoint local pour l'autocomplete CP/Ville.
// Appel server-side a geo.api.gouv.fr (API officielle, sans rate limit).
// Format de reponse : { input: string, cities: [{ code: string, city: string }] }

import { NextRequest, NextResponse } from 'next/server';

const GEO_API = 'https://geo.api.gouv.fr/communes';

// Cache en memoire simple (duree de vie du processus Node.js)
const _cache = new Map<string, { cities: CityResult[]; ts: number }>();
const CACHE_TTL = 3600 * 1000; // 1 heure

interface GeoApiCommune {
  nom: string;
  codesPostaux?: string[];
}

interface CityResult {
  code: string;
  city: string;
}

function normalizeCityName(city: string): string {
  city = city.toLowerCase().trim();
  city = city.replace(/^st\s+/i, 'saint ');
  city = city.replace(/^ste\s+/i, 'sainte ');
  city = city.replace(/\bst\b/gi, 'saint');
  city = city.replace(/\bste\b/gi, 'sainte');
  city = city.replace(/-st-/gi, '-saint-');
  city = city.replace(/-ste-/gi, '-sainte-');
  city = city.replace(/^st-/i, 'saint-');
  city = city.replace(/^ste-/i, 'sainte-');
  city = city.replace(/-s\/-/gi, '-sur-');
  city = city.replace(/-\/s-/gi, '-sous-');
  city = city.replace(/\bs\/\b/gi, 'sur');
  city = city.replace(/\bs\/s\b/gi, 'sous');
  return city.trim();
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = (searchParams.get('code') || '').trim();
  const city = (searchParams.get('city') || '').trim();

  if (!code && !city) {
    return NextResponse.json({ input: '', cities: [] });
  }

  const input = code || city;

  if (input.length < 2) {
    return NextResponse.json({ input, cities: [] });
  }

  // Cache
  const cacheKey = code ? `code:${code}` : `city:${city}`;
  const cached = _cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(
      { input, cities: cached.cities },
      { headers: { 'Cache-Control': 'public, max-age=3600' } }
    );
  }

  let cities: CityResult[] = [];

  try {
    let url: string;

    if (code) {
      url = `${GEO_API}?codePostal=${encodeURIComponent(code)}&fields=nom,codesPostaux&limit=20`;
    } else {
      const normalized = normalizeCityName(city);
      url = `${GEO_API}?nom=${encodeURIComponent(normalized)}&fields=nom,codesPostaux&boost=population&limit=15`;
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'espace-abo/1.0 (geo.api.gouv.fr)' },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data: GeoApiCommune[] = await res.json();

      for (const commune of data) {
        if (!commune.nom || !commune.codesPostaux?.length) continue;

        for (const cp of commune.codesPostaux) {
          if (code && !cp.startsWith(code)) continue;
          cities.push({ code: cp, city: commune.nom });
        }
      }

      cities.sort((a, b) => a.code.localeCompare(b.code) || a.city.localeCompare(b.city));

      cities = cities.filter(
        (c, i, arr) => i === 0 || c.code !== arr[i - 1].code || c.city !== arr[i - 1].city
      );
    }
  } catch (err) {
    console.error('[Vicopo] Erreur geo.api.gouv.fr:', err);
  }

  _cache.set(cacheKey, { cities, ts: Date.now() });

  return NextResponse.json(
    { input, cities },
    { headers: { 'Cache-Control': 'public, max-age=3600' } }
  );
}
