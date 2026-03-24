// Utilitaire geographique : coordonnees GPS depuis code postal

export interface CommuneGeo {
  code: string; // code INSEE
  nom: string;
  lon: number;
  lat: number;
}

/**
 * Recupere les coordonnees GPS d'une commune a partir du code postal
 * via l'API geo.api.gouv.fr
 */
export async function getCommuneGeo(codePostal: string): Promise<CommuneGeo | null> {
  try {
    const res = await fetch(
      `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(codePostal)}&fields=code,nom,centre&format=json`,
      { next: { revalidate: 86400 } }
    );

    if (!res.ok) return null;

    const communes: { code: string; nom: string; centre: { coordinates: [number, number] } }[] =
      await res.json();

    if (communes.length === 0 || !communes[0].centre) return null;

    const c = communes[0];
    return {
      code: c.code,
      nom: c.nom,
      lon: c.centre.coordinates[0],
      lat: c.centre.coordinates[1],
    };
  } catch {
    return null;
  }
}
