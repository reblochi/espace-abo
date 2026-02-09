// Calcul des taxes pour le certificat d'immatriculation (carte grise)

import type { VehicleData } from '@/types/registration-certificate';

// Taux de taxe regionale par region (EUR/CV) - 2026
// Source: https://www.service-public.fr/particuliers/vosdroits/F19211
export const REGIONAL_TAX_RATES: Record<string, number> = {
  '01': 55.00, // Auvergne-Rhone-Alpes
  '02': 51.20, // Bourgogne-Franche-Comte
  '03': 55.00, // Bretagne
  '04': 55.00, // Centre-Val de Loire
  '06': 51.00, // Grand Est
  '32': 51.20, // Hauts-de-France
  '11': 54.95, // Ile-de-France
  '28': 51.00, // Normandie
  '44': 55.00, // Nouvelle-Aquitaine
  '76': 51.20, // Occitanie
  '52': 55.00, // Pays de la Loire
  '93': 59.50, // Provence-Alpes-Cote d'Azur
  '94': 51.17, // Corse
  // DOM
  '01D': 45.00, // Guadeloupe
  '02D': 30.00, // Martinique
  '03D': 42.50, // Guyane
  '04D': 51.00, // La Reunion
  '06D': 30.00, // Mayotte
};

// Mapping departement -> region
const DEPARTMENT_TO_REGION: Record<string, string> = {
  // Auvergne-Rhone-Alpes
  '01': '01', '03': '01', '07': '01', '15': '01', '26': '01', '38': '01',
  '42': '01', '43': '01', '63': '01', '69': '01', '73': '01', '74': '01',
  // Bourgogne-Franche-Comte
  '21': '02', '25': '02', '39': '02', '58': '02', '70': '02', '71': '02', '89': '02', '90': '02',
  // Bretagne
  '22': '03', '29': '03', '35': '03', '56': '03',
  // Centre-Val de Loire
  '18': '04', '28': '04', '36': '04', '37': '04', '41': '04', '45': '04',
  // Grand Est
  '08': '06', '10': '06', '51': '06', '52': '06', '54': '06', '55': '06',
  '57': '06', '67': '06', '68': '06', '88': '06',
  // Hauts-de-France
  '02': '32', '59': '32', '60': '32', '62': '32', '80': '32',
  // Ile-de-France
  '75': '11', '77': '11', '78': '11', '91': '11', '92': '11', '93': '11', '94': '11', '95': '11',
  // Normandie
  '14': '28', '27': '28', '50': '28', '61': '28', '76': '28',
  // Nouvelle-Aquitaine
  '16': '44', '17': '44', '19': '44', '23': '44', '24': '44', '33': '44',
  '40': '44', '47': '44', '64': '44', '79': '44', '86': '44', '87': '44',
  // Occitanie
  '09': '76', '11': '76', '12': '76', '30': '76', '31': '76', '32': '76',
  '34': '76', '46': '76', '48': '76', '65': '76', '66': '76', '81': '76', '82': '76',
  // Pays de la Loire
  '44': '52', '49': '52', '53': '52', '72': '52', '85': '52',
  // Provence-Alpes-Cote d'Azur
  '04': '93', '05': '93', '06': '93', '13': '93', '83': '93', '84': '93',
  // Corse
  '2A': '94', '2B': '94',
  // DOM
  '971': '01D', '972': '02D', '973': '03D', '974': '04D', '976': '06D',
};

// Bareme malus ecologique 2026 (en EUR)
// Source: Loi de finances 2026
const MALUS_BAREME_2026: { minCO2: number; maxCO2: number | null; amount: number }[] = [
  { minCO2: 118, maxCO2: 118, amount: 50 },
  { minCO2: 119, maxCO2: 119, amount: 75 },
  { minCO2: 120, maxCO2: 120, amount: 100 },
  { minCO2: 121, maxCO2: 121, amount: 125 },
  { minCO2: 122, maxCO2: 122, amount: 150 },
  { minCO2: 123, maxCO2: 123, amount: 170 },
  { minCO2: 124, maxCO2: 124, amount: 190 },
  { minCO2: 125, maxCO2: 125, amount: 210 },
  { minCO2: 126, maxCO2: 126, amount: 230 },
  { minCO2: 127, maxCO2: 127, amount: 240 },
  { minCO2: 128, maxCO2: 128, amount: 260 },
  { minCO2: 129, maxCO2: 129, amount: 280 },
  { minCO2: 130, maxCO2: 130, amount: 310 },
  { minCO2: 131, maxCO2: 131, amount: 330 },
  { minCO2: 132, maxCO2: 132, amount: 360 },
  { minCO2: 133, maxCO2: 133, amount: 400 },
  { minCO2: 134, maxCO2: 134, amount: 450 },
  { minCO2: 135, maxCO2: 135, amount: 540 },
  { minCO2: 136, maxCO2: 136, amount: 650 },
  { minCO2: 137, maxCO2: 137, amount: 740 },
  { minCO2: 138, maxCO2: 138, amount: 818 },
  { minCO2: 139, maxCO2: 139, amount: 898 },
  { minCO2: 140, maxCO2: 140, amount: 983 },
  { minCO2: 141, maxCO2: 141, amount: 1074 },
  { minCO2: 142, maxCO2: 142, amount: 1172 },
  { minCO2: 143, maxCO2: 143, amount: 1276 },
  { minCO2: 144, maxCO2: 144, amount: 1386 },
  { minCO2: 145, maxCO2: 145, amount: 1504 },
  { minCO2: 146, maxCO2: 146, amount: 1629 },
  { minCO2: 147, maxCO2: 147, amount: 1761 },
  { minCO2: 148, maxCO2: 148, amount: 1901 },
  { minCO2: 149, maxCO2: 149, amount: 2049 },
  { minCO2: 150, maxCO2: 150, amount: 2205 },
  { minCO2: 151, maxCO2: 151, amount: 2370 },
  { minCO2: 152, maxCO2: 152, amount: 2544 },
  { minCO2: 153, maxCO2: 153, amount: 2726 },
  { minCO2: 154, maxCO2: 154, amount: 2918 },
  { minCO2: 155, maxCO2: 155, amount: 3119 },
  { minCO2: 156, maxCO2: 156, amount: 3331 },
  { minCO2: 157, maxCO2: 157, amount: 3552 },
  { minCO2: 158, maxCO2: 158, amount: 3784 },
  { minCO2: 159, maxCO2: 159, amount: 4026 },
  { minCO2: 160, maxCO2: 160, amount: 4279 },
  { minCO2: 161, maxCO2: 161, amount: 4543 },
  { minCO2: 162, maxCO2: 162, amount: 4818 },
  { minCO2: 163, maxCO2: 163, amount: 5105 },
  { minCO2: 164, maxCO2: 164, amount: 5404 },
  { minCO2: 165, maxCO2: 165, amount: 5715 },
  { minCO2: 166, maxCO2: 166, amount: 6039 },
  { minCO2: 167, maxCO2: 167, amount: 6375 },
  { minCO2: 168, maxCO2: 168, amount: 6724 },
  { minCO2: 169, maxCO2: 169, amount: 7086 },
  { minCO2: 170, maxCO2: 170, amount: 7462 },
  { minCO2: 171, maxCO2: 171, amount: 7851 },
  { minCO2: 172, maxCO2: 172, amount: 8254 },
  { minCO2: 173, maxCO2: 173, amount: 8671 },
  { minCO2: 174, maxCO2: 174, amount: 9103 },
  { minCO2: 175, maxCO2: 175, amount: 9550 },
  { minCO2: 176, maxCO2: 176, amount: 10011 },
  { minCO2: 177, maxCO2: 177, amount: 10488 },
  { minCO2: 178, maxCO2: 178, amount: 10980 },
  { minCO2: 179, maxCO2: 179, amount: 11488 },
  { minCO2: 180, maxCO2: 180, amount: 12012 },
  { minCO2: 181, maxCO2: 181, amount: 12552 },
  { minCO2: 182, maxCO2: 182, amount: 13109 },
  { minCO2: 183, maxCO2: 183, amount: 13682 },
  { minCO2: 184, maxCO2: 184, amount: 14273 },
  { minCO2: 185, maxCO2: 185, amount: 14881 },
  { minCO2: 186, maxCO2: 186, amount: 15506 },
  { minCO2: 187, maxCO2: 187, amount: 16149 },
  { minCO2: 188, maxCO2: 188, amount: 16810 },
  { minCO2: 189, maxCO2: 189, amount: 17490 },
  { minCO2: 190, maxCO2: 190, amount: 18188 },
  { minCO2: 191, maxCO2: 191, amount: 18905 },
  { minCO2: 192, maxCO2: 192, amount: 19641 },
  { minCO2: 193, maxCO2: null, amount: 50000 }, // Maximum
];

// Taxe fixe de gestion
const TAXE_GESTION = 1100; // 11.00 EUR en centimes

// Taxe d'acheminement
const TAXE_ACHEMINEMENT = 276; // 2.76 EUR en centimes

export interface RegistrationCertificateTaxes {
  taxeRegionale: number;      // en centimes
  taxeGestion: number;        // en centimes
  taxeAcheminement: number;   // en centimes
  malus: number;              // en centimes
  serviceFee: number;         // en centimes
  total: number;              // en centimes
}

export interface TaxCalculationInput {
  vehicle: VehicleData;
  departmentCode: string;
}

/**
 * Calcul de la taxe regionale
 * Formule: CV fiscaux x taux regional
 */
export function calculateRegionalTax(fiscalPower: number, departmentCode: string): number {
  const regionCode = DEPARTMENT_TO_REGION[departmentCode] || '11'; // Default IDF
  const rate = REGIONAL_TAX_RATES[regionCode] || 54.95;
  return Math.round(fiscalPower * rate * 100); // en centimes
}

/**
 * Calcul du malus ecologique
 * Applicable uniquement pour les vehicules neufs
 */
export function calculateMalus(co2?: number, vehicleState?: number): number {
  // Malus uniquement pour vehicules neufs (state = 1)
  if (vehicleState !== 1) return 0;
  if (!co2 || co2 < 118) return 0;

  const threshold = MALUS_BAREME_2026.find(
    t => co2 >= t.minCO2 && (t.maxCO2 === null || co2 <= t.maxCO2)
  );

  return threshold ? threshold.amount * 100 : 0; // en centimes
}

/**
 * Exoneration taxe regionale pour vehicules propres
 */
export function isExemptFromRegionalTax(energyId: number): boolean {
  // Energies propres exonerees: electrique (1), hydrogene (2)
  return [1, 2].includes(energyId);
}

/**
 * Reduction taxe regionale pour vehicules hybrides
 */
export function getHybridReduction(energyId: number, regionCode: string): number {
  // Hybride rechargeable (3) peut avoir une reduction selon la region
  if (energyId !== 3) return 1;

  // Certaines regions accordent 50% de reduction
  const regionsWithReduction = ['11', '44', '52']; // IDF, Nouvelle-Aquitaine, Pays de la Loire
  return regionsWithReduction.includes(regionCode) ? 0.5 : 1;
}

/**
 * Calcul complet des taxes carte grise
 */
export function calculateRegistrationTaxes(
  input: TaxCalculationInput,
  serviceFee: number = 7990 // 79.90 EUR par defaut
): RegistrationCertificateTaxes {
  const { vehicle, departmentCode } = input;
  const regionCode = DEPARTMENT_TO_REGION[departmentCode] || '11';

  // Taxe regionale
  let taxeRegionale = 0;
  if (!isExemptFromRegionalTax(vehicle.energyId)) {
    taxeRegionale = calculateRegionalTax(vehicle.fiscalPower, departmentCode);
    const reduction = getHybridReduction(vehicle.energyId, regionCode);
    taxeRegionale = Math.round(taxeRegionale * reduction);
  }

  // Taxe de gestion
  const taxeGestion = TAXE_GESTION;

  // Taxe d'acheminement
  const taxeAcheminement = TAXE_ACHEMINEMENT;

  // Malus ecologique
  const malus = calculateMalus(vehicle.co2, vehicle.state);

  // Total
  const total = taxeRegionale + taxeGestion + taxeAcheminement + malus + serviceFee;

  return {
    taxeRegionale,
    taxeGestion,
    taxeAcheminement,
    malus,
    serviceFee,
    total,
  };
}

/**
 * Formatage du detail des taxes
 */
export function formatTaxBreakdown(taxes: RegistrationCertificateTaxes): {
  label: string;
  amount: string;
}[] {
  const items = [];

  if (taxes.taxeRegionale > 0) {
    items.push({
      label: 'Taxe regionale',
      amount: formatCentsToEuros(taxes.taxeRegionale),
    });
  }

  items.push({
    label: 'Taxe de gestion',
    amount: formatCentsToEuros(taxes.taxeGestion),
  });

  items.push({
    label: 'Redevance d\'acheminement',
    amount: formatCentsToEuros(taxes.taxeAcheminement),
  });

  if (taxes.malus > 0) {
    items.push({
      label: 'Malus ecologique',
      amount: formatCentsToEuros(taxes.malus),
    });
  }

  items.push({
    label: 'Frais de service',
    amount: formatCentsToEuros(taxes.serviceFee),
  });

  items.push({
    label: 'Total',
    amount: formatCentsToEuros(taxes.total),
  });

  return items;
}

function formatCentsToEuros(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' EUR';
}

/**
 * Recuperer le taux regional pour un departement
 */
export function getRegionalRate(departmentCode: string): number {
  const regionCode = DEPARTMENT_TO_REGION[departmentCode] || '11';
  return REGIONAL_TAX_RATES[regionCode] || 54.95;
}

/**
 * Lister toutes les regions avec leurs taux
 */
export function getAllRegionalRates(): { code: string; name: string; rate: number }[] {
  const regionNames: Record<string, string> = {
    '01': 'Auvergne-Rhone-Alpes',
    '02': 'Bourgogne-Franche-Comte',
    '03': 'Bretagne',
    '04': 'Centre-Val de Loire',
    '06': 'Grand Est',
    '32': 'Hauts-de-France',
    '11': 'Ile-de-France',
    '28': 'Normandie',
    '44': 'Nouvelle-Aquitaine',
    '76': 'Occitanie',
    '52': 'Pays de la Loire',
    '93': 'Provence-Alpes-Cote d\'Azur',
    '94': 'Corse',
  };

  return Object.entries(REGIONAL_TAX_RATES)
    .filter(([code]) => !code.endsWith('D')) // Exclure DOM pour liste principale
    .map(([code, rate]) => ({
      code,
      name: regionNames[code] || code,
      rate,
    }));
}
