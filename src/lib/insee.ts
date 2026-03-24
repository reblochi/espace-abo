// Utilitaire : resolution code postal -> codes INSEE (avec arrondissements)

/**
 * Ajoute les codes INSEE d'arrondissement pour Paris, Lyon et Marseille.
 * Les services publics de ces villes sont enregistres par arrondissement.
 */
export function addArrondissementInsee(zipCode: string, codeInsee: string[]): void {
  if (zipCode.startsWith('750') && zipCode.length === 5) {
    const arr = parseInt(zipCode.slice(3), 10);
    if (arr >= 1 && arr <= 20) {
      codeInsee.push(`751${arr.toString().padStart(2, '0')}`);
    }
  } else if (zipCode.startsWith('6900') && zipCode.length === 5) {
    const arr = parseInt(zipCode.slice(4), 10);
    if (arr >= 1 && arr <= 9) {
      codeInsee.push(`6938${arr}`);
    }
  } else if (zipCode.startsWith('130') && zipCode.length === 5) {
    const arr = parseInt(zipCode.slice(3), 10);
    if (arr >= 1 && arr <= 16) {
      codeInsee.push(`132${arr.toString().padStart(2, '0')}`);
    }
  }
}
