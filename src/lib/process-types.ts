// Types et configurations des demarches

export type ProcessTypeCode =
  | 'CIVIL_STATUS_BIRTH'
  | 'CIVIL_STATUS_MARRIAGE'
  | 'CIVIL_STATUS_DEATH';

export type ActTypeCode =
  | 'FULL_COPY'
  | 'EXTRACT_WITH_FILIATION'
  | 'EXTRACT_WITHOUT_FILIATION';

export interface ProcessTypeConfig {
  code: ProcessTypeCode;
  label: string;
  description: string;
  icon: string;
  price: number; // en centimes
  actTypes: ActTypeOption[];
  requiredFields: string[];
}

export interface ActTypeOption {
  code: ActTypeCode;
  label: string;
  description: string;
}

export const ACT_TYPES: ActTypeOption[] = [
  {
    code: 'FULL_COPY',
    label: 'Copie integrale',
    description: 'Document complet avec toutes les mentions marginales',
  },
  {
    code: 'EXTRACT_WITH_FILIATION',
    label: 'Extrait avec filiation',
    description: 'Extrait mentionnant les parents',
  },
  {
    code: 'EXTRACT_WITHOUT_FILIATION',
    label: 'Extrait sans filiation',
    description: 'Extrait sans mention des parents',
  },
];

export const PROCESS_TYPES: ProcessTypeConfig[] = [
  {
    code: 'CIVIL_STATUS_BIRTH',
    label: 'Acte de naissance',
    description: 'Obtenez une copie ou un extrait d\'acte de naissance',
    icon: 'baby',
    price: 2990, // 29.90 EUR
    actTypes: ACT_TYPES,
    requiredFields: ['beneficiaryFirstName', 'beneficiaryLastName', 'eventDate', 'eventCity'],
  },
  {
    code: 'CIVIL_STATUS_MARRIAGE',
    label: 'Acte de mariage',
    description: 'Obtenez une copie ou un extrait d\'acte de mariage',
    icon: 'rings',
    price: 2990,
    actTypes: ACT_TYPES,
    requiredFields: ['beneficiaryFirstName', 'beneficiaryLastName', 'spouseFirstName', 'spouseLastName', 'eventDate', 'eventCity'],
  },
  {
    code: 'CIVIL_STATUS_DEATH',
    label: 'Acte de deces',
    description: 'Obtenez une copie ou un extrait d\'acte de deces',
    icon: 'document',
    price: 2990,
    actTypes: ACT_TYPES.filter(t => t.code !== 'EXTRACT_WITH_FILIATION'),
    requiredFields: ['beneficiaryFirstName', 'beneficiaryLastName', 'eventDate', 'eventCity'],
  },
];

// Mapping URL slug -> code
const URL_TO_CODE: Record<string, ProcessTypeCode> = {
  'acte-naissance': 'CIVIL_STATUS_BIRTH',
  'acte-mariage': 'CIVIL_STATUS_MARRIAGE',
  'acte-deces': 'CIVIL_STATUS_DEATH',
};

export function getProcessTypeConfig(codeOrSlug: ProcessTypeCode | string): ProcessTypeConfig | undefined {
  const code = URL_TO_CODE[codeOrSlug] || codeOrSlug;
  return PROCESS_TYPES.find(t => t.code === code);
}

export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' EUR';
}
