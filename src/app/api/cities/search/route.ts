// API Route - Recherche de communes via API Advercity

import { NextRequest, NextResponse } from 'next/server';
import { searchCities } from '@/lib/advercity';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const cities = await searchCities(query, Math.min(limit, 20));

    return NextResponse.json(cities);
  } catch (error) {
    console.error('Erreur recherche communes:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500 }
    );
  }
}
