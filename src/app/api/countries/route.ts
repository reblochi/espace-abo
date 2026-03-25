// API Route - Liste des pays de naissance
// Source de verite : API Advercity (table demarche_acte_pays)
// Fallback : liste statique locale
// Cache : 24h cote serveur

import { NextResponse } from 'next/server';
import { getCountries } from '@/lib/advercity';
import { COUNTRIES } from '@/lib/countries';

// Cache en memoire (24h)
let cachedCountries: { id: number; label: string }[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

export async function GET() {
  try {
    // Verifier le cache
    if (cachedCountries && Date.now() < cacheExpiry) {
      return NextResponse.json(cachedCountries, {
        headers: { 'Cache-Control': 'public, max-age=86400' },
      });
    }

    // Appeler l'API Advercity
    const countries = await getCountries();

    if (countries.length > 0) {
      cachedCountries = countries;
      cacheExpiry = Date.now() + CACHE_TTL;
      return NextResponse.json(countries, {
        headers: { 'Cache-Control': 'public, max-age=86400' },
      });
    }

    // Fallback : liste statique
    return NextResponse.json(COUNTRIES, {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    });
  } catch {
    // Fallback : liste statique
    return NextResponse.json(COUNTRIES, {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    });
  }
}
