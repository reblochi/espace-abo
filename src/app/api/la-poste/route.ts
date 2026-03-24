// API Route - Bureaux de poste et boites aux lettres proches du client
// Utilise les CSV de La Poste (donnees statiques)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getCommuneGeo } from '@/lib/geo';
import fs from 'fs';
import path from 'path';

export interface BureauPoste {
  id: string;
  nom: string;
  type: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string | null;
  latitude: number | null;
  longitude: number | null;
  distributeurBillets: boolean;
  automate24h: boolean;
}

export interface BoiteAuxLettres {
  id: string;
  adresse: string;
  ville: string;
  codePostal: string;
  releveSemaine: string | null;
  releveSamedi: string | null;
}

export interface LaPosteResponse {
  bureaux: BureauPoste[];
  boites: BoiteAuxLettres[];
  codePostal: string;
}

// Cache en memoire pour eviter de parser les CSV a chaque requete
let bureauxCache: Map<string, BureauPoste[]> | null = null;
let boitesCache: Map<string, BoiteAuxLettres[]> | null = null;

function parseBureauxCSV(): Map<string, BureauPoste[]> {
  if (bureauxCache) return bureauxCache;

  const filePath = path.join(process.cwd(), 'data', 'bureaux-poste.csv');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const map = new Map<string, BureauPoste[]>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(';');
    const cp = cols[8]?.trim();
    if (!cp) continue;

    const bureau: BureauPoste = {
      id: cols[0]?.trim() || '',
      nom: cols[2]?.trim() || '',
      type: cols[3]?.trim() || '',
      adresse: cols[5]?.trim() || '',
      codePostal: cp,
      ville: cols[9]?.trim() || '',
      telephone: cols[15]?.trim() || null,
      latitude: cols[12] ? parseFloat(cols[12]) : null,
      longitude: cols[13] ? parseFloat(cols[13]) : null,
      distributeurBillets: cols[17]?.trim() === 'Oui',
      automate24h: false,
    };

    if (!map.has(cp)) map.set(cp, []);
    map.get(cp)!.push(bureau);
  }

  bureauxCache = map;
  return map;
}

function parseBoitesCSV(): Map<string, BoiteAuxLettres[]> {
  if (boitesCache) return boitesCache;

  const filePath = path.join(process.cwd(), 'data', 'boites-aux-lettres.csv');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const map = new Map<string, BoiteAuxLettres[]>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(';');
    const cp = cols[5]?.trim();
    if (!cp) continue;

    // Construire l'adresse
    const numero = cols[1]?.trim();
    const extension = cols[2]?.trim();
    const voie = cols[3]?.trim();
    let adresse = '';
    if (numero && numero !== 'NULL') adresse += numero + ' ';
    if (extension && extension !== 'NULL') adresse += extension + ' ';
    if (voie) adresse += voie;
    adresse = adresse.trim();

    // Parser les horaires de releve
    const releveSemaine = cols[9]?.trim();
    const releveSamedi = cols[10]?.trim();

    const boite: BoiteAuxLettres = {
      id: cols[0]?.trim() || '',
      adresse,
      ville: cols[4]?.trim() || '',
      codePostal: cp,
      releveSemaine: releveSemaine ? formatHeure(releveSemaine) : null,
      releveSamedi: releveSamedi ? formatHeure(releveSamedi) : null,
    };

    if (!map.has(cp)) map.set(cp, []);
    map.get(cp)!.push(boite);
  }

  boitesCache = map;
  return map;
}

function formatHeure(raw: string): string | null {
  // Format: T09:00:00+00:00 -> 09:00
  const match = raw.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : null;
}

/** Distance en km entre deux points GPS (formule de Haversine) */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Trouve les N bureaux de poste les plus proches d'un point GPS */
function findNearestBureaux(
  map: Map<string, BureauPoste[]>,
  lat: number,
  lon: number,
  maxResults: number
): BureauPoste[] {
  const all: { bureau: BureauPoste; dist: number }[] = [];

  for (const bureaux of map.values()) {
    for (const b of bureaux) {
      if (b.latitude != null && b.longitude != null) {
        const dist = haversineKm(lat, lon, b.latitude, b.longitude);
        if (dist <= 20) {
          // Max 20km
          all.push({ bureau: b, dist });
        }
      }
    }
  }

  all.sort((a, b) => a.dist - b.dist);
  return all.slice(0, maxResults).map((a) => a.bureau);
}

// GET /api/la-poste
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

    const cp = user.zipCode;

    const bureauxMap = parseBureauxCSV();
    const boitesMap = parseBoitesCSV();

    let bureaux = bureauxMap.get(cp) || [];
    let boites = (boitesMap.get(cp) || []).slice(0, 10);

    // Fallback : si aucun bureau, chercher les plus proches par distance GPS
    if (bureaux.length === 0) {
      const geo = await getCommuneGeo(cp);
      if (geo) {
        bureaux = findNearestBureaux(bureauxMap, geo.lat, geo.lon, 5);
      }
    }

    return NextResponse.json({
      bureaux,
      boites,
      codePostal: cp,
    } satisfies LaPosteResponse);
  } catch (error) {
    console.error('Erreur la-poste:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation des donnees La Poste' },
      { status: 500 }
    );
  }
}
