// Types et configurations des demarches
// Aligne avec le codebase Advercity

import type { ProcessType, FileType } from '@/types';

// ============================================================
// TYPES D'ACTES (pour etat civil)
// ============================================================

export type ActTypeCode =
  | 'FULL_COPY'
  | 'EXTRACT_WITH_FILIATION'
  | 'EXTRACT_WITHOUT_FILIATION';

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

// ============================================================
// CATEGORIES DE DEMARCHES
// ============================================================

export type ProcessCategory = 'vehicle' | 'civil_status' | 'identity' | 'business' | 'housing' | 'justice';

export const PROCESS_CATEGORIES: Record<ProcessCategory, { label: string; icon: string }> = {
  vehicle: { label: 'Vehicule', icon: 'car' },
  civil_status: { label: 'Etat civil', icon: 'file-text' },
  identity: { label: 'Identite', icon: 'user' },
  business: { label: 'Entreprise', icon: 'building' },
  housing: { label: 'Logement', icon: 'home' },
  justice: { label: 'Justice', icon: 'scale' },
};

// ============================================================
// DOCUMENTS REQUIS PAR TYPE DE DEMARCHE
// ============================================================

export interface DocumentRequirement {
  id: FileType;
  label: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
  maxSizeMb: number;
  conditionalOn?: Record<string, string[]>;
}

// Documents requis pour certificat d'immatriculation
export const REGISTRATION_CERTIFICATE_DOCUMENTS: DocumentRequirement[] = [
  {
    id: 'CNI',
    label: 'Piece d\'identite',
    description: 'Carte d\'identite ou passeport en cours de validite',
    required: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMb: 10,
  },
  {
    id: 'JUSTIFICATIF_DOMICILE',
    label: 'Justificatif de domicile',
    description: 'De moins de 6 mois (facture EDF, telephone, avis d\'imposition...)',
    required: true,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMb: 10,
  },
  {
    id: 'CARTE_GRISE',
    label: 'Ancienne carte grise',
    description: 'Recto et verso, barree avec mention "Vendu le" et signature',
    required: true,
    conditionalOn: { 'operation.typeId': ['1'] }, // CHANGEMENT_TITULAIRE
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMb: 10,
  },
  {
    id: 'CERTIFICAT_CESSION',
    label: 'Certificat de cession',
    description: 'Formulaire Cerfa 15776*01 signe par vendeur et acheteur',
    required: true,
    conditionalOn: { 'operation.typeId': ['1'] },
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMb: 10,
  },
  {
    id: 'CERTIFICAT_NON_GAGE',
    label: 'Certificat de non-gage',
    description: 'Certificat de situation administrative du vehicule',
    required: true,
    conditionalOn: { 'operation.typeId': ['1'] },
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMb: 10,
  },
  {
    id: 'CONTROLE_TECHNIQUE',
    label: 'Controle technique',
    description: 'De moins de 6 mois pour vehicules de plus de 4 ans',
    required: false,
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMb: 10,
  },
  {
    id: 'DECLARATION_PERTE',
    label: 'Declaration de perte/vol',
    description: 'Declaration de perte ou depot de plainte',
    required: true,
    conditionalOn: { 'operation.typeId': ['3'] }, // DUPLICATA
    acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
    maxSizeMb: 10,
  },
];

// ============================================================
// CONFIGURATION COMPLETE DES DEMARCHES
// ============================================================

export interface ProcessTypeConfig {
  code: ProcessType;
  advercityClass: string;
  label: string;
  description: string;
  icon: string;
  category: ProcessCategory;
  basePrice: number; // en centimes (frais de service)
  hasTaxes: boolean; // si taxes specifiques (ex: taxe regionale)
  estimatedDelay: string;
  includedInSubscription: boolean;
  subscriberPrice: number; // Prix pour abonnes (0 = inclus)
  requiredDocuments: DocumentRequirement[];
  subtypes?: { code: string; label: string }[];
}

export const PROCESS_TYPES_CONFIG: Record<ProcessType, ProcessTypeConfig> = {
  // ═══════════════════════════════════════════════════════════
  // VEHICULE
  // ═══════════════════════════════════════════════════════════
  REGISTRATION_CERT: {
    code: 'REGISTRATION_CERT',
    advercityClass: 'ProcessRegistrationCertificate',
    label: 'Certificat d\'immatriculation',
    description: 'Changement de titulaire, adresse, duplicata...',
    icon: 'car',
    category: 'vehicle',
    basePrice: 7990, // 79.90 EUR
    hasTaxes: true, // Taxes regionales + malus
    estimatedDelay: '5-7 jours ouvres',
    includedInSubscription: true,
    subscriberPrice: 0,
    requiredDocuments: REGISTRATION_CERTIFICATE_DOCUMENTS,
    subtypes: [
      { code: 'change_owner', label: 'Changement de titulaire' },
      { code: 'change_address', label: 'Changement d\'adresse' },
      { code: 'duplicate', label: 'Duplicata' },
    ],
  },

  NON_PLEDGE_CERT: {
    code: 'NON_PLEDGE_CERT',
    advercityClass: 'ProcessNonPledgeCertificate',
    label: 'Certificat de non-gage',
    description: 'Certificat de situation administrative du vehicule',
    icon: 'shield-check',
    category: 'vehicle',
    basePrice: 1990, // 19.90 EUR
    hasTaxes: false,
    estimatedDelay: '24-48h',
    includedInSubscription: true,
    subscriberPrice: 0,
    requiredDocuments: [
      {
        id: 'CNI',
        label: 'Piece d\'identite',
        description: 'Carte d\'identite ou passeport',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeMb: 10,
      },
    ],
  },

  CRITAIR: {
    code: 'CRITAIR',
    advercityClass: 'ProcessCritair',
    label: 'Vignette Crit\'Air',
    description: 'Vignette pollution pour circuler en ZFE',
    icon: 'leaf',
    category: 'vehicle',
    basePrice: 1490, // 14.90 EUR
    hasTaxes: false,
    estimatedDelay: '5-7 jours ouvres',
    includedInSubscription: true,
    subscriberPrice: 0,
    requiredDocuments: [
      {
        id: 'CARTE_GRISE',
        label: 'Carte grise',
        description: 'Carte grise du vehicule',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeMb: 10,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // ETAT CIVIL
  // ═══════════════════════════════════════════════════════════
  CIVIL_STATUS_BIRTH: {
    code: 'CIVIL_STATUS_BIRTH',
    advercityClass: 'ProcessCivilStatusRecord',
    label: 'Acte de naissance',
    description: 'Copie integrale ou extrait d\'acte de naissance',
    icon: 'baby',
    category: 'civil_status',
    basePrice: 2990, // 29.90 EUR
    hasTaxes: false,
    estimatedDelay: '3-5 jours ouvres',
    includedInSubscription: true,
    subscriberPrice: 0,
    requiredDocuments: [
      {
        id: 'CNI',
        label: 'Piece d\'identite',
        description: 'Carte d\'identite ou passeport',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeMb: 10,
      },
    ],
    subtypes: ACT_TYPES.map(t => ({ code: t.code, label: t.label })),
  },

  CIVIL_STATUS_MARRIAGE: {
    code: 'CIVIL_STATUS_MARRIAGE',
    advercityClass: 'ProcessCivilStatusRecord',
    label: 'Acte de mariage',
    description: 'Copie integrale ou extrait d\'acte de mariage',
    icon: 'heart',
    category: 'civil_status',
    basePrice: 2990,
    hasTaxes: false,
    estimatedDelay: '3-5 jours ouvres',
    includedInSubscription: true,
    subscriberPrice: 0,
    requiredDocuments: [
      {
        id: 'CNI',
        label: 'Piece d\'identite',
        description: 'Carte d\'identite ou passeport',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeMb: 10,
      },
    ],
    subtypes: ACT_TYPES.map(t => ({ code: t.code, label: t.label })),
  },

  CIVIL_STATUS_DEATH: {
    code: 'CIVIL_STATUS_DEATH',
    advercityClass: 'ProcessCivilStatusRecord',
    label: 'Acte de deces',
    description: 'Copie integrale ou extrait d\'acte de deces',
    icon: 'file-text',
    category: 'civil_status',
    basePrice: 2990,
    hasTaxes: false,
    estimatedDelay: '3-5 jours ouvres',
    includedInSubscription: true,
    subscriberPrice: 0,
    requiredDocuments: [
      {
        id: 'CNI',
        label: 'Piece d\'identite',
        description: 'Carte d\'identite ou passeport',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeMb: 10,
      },
    ],
    subtypes: ACT_TYPES.filter(t => t.code !== 'EXTRACT_WITH_FILIATION').map(t => ({ code: t.code, label: t.label })),
  },

  // ═══════════════════════════════════════════════════════════
  // IDENTITE
  // ═══════════════════════════════════════════════════════════
  IDENTITY_CARD: {
    code: 'IDENTITY_CARD',
    advercityClass: 'ProcessIdentityCard',
    label: 'Carte d\'identite',
    description: 'Premiere demande, renouvellement ou perte',
    icon: 'id-card',
    category: 'identity',
    basePrice: 3990, // 39.90 EUR
    hasTaxes: false,
    estimatedDelay: '10-15 jours ouvres',
    includedInSubscription: true,
    subscriberPrice: 0,
    requiredDocuments: [
      {
        id: 'PHOTO_IDENTITE',
        label: 'Photo d\'identite',
        description: 'Photo aux normes',
        required: true,
        acceptedFormats: ['jpg', 'jpeg', 'png'],
        maxSizeMb: 5,
      },
      {
        id: 'JUSTIFICATIF_DOMICILE',
        label: 'Justificatif de domicile',
        description: 'De moins de 3 mois',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeMb: 10,
      },
      {
        id: 'ACTE_NAISSANCE',
        label: 'Acte de naissance',
        description: 'De moins de 3 mois',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeMb: 10,
      },
    ],
    subtypes: [
      { code: 'first', label: 'Premiere demande' },
      { code: 'renewal', label: 'Renouvellement' },
      { code: 'lost', label: 'Perte ou vol' },
    ],
  },

  PASSPORT: {
    code: 'PASSPORT',
    advercityClass: 'ProcessPassport',
    label: 'Passeport',
    description: 'Premiere demande, renouvellement ou perte',
    icon: 'plane',
    category: 'identity',
    basePrice: 4990, // 49.90 EUR
    hasTaxes: false,
    estimatedDelay: '10-15 jours ouvres',
    includedInSubscription: true,
    subscriberPrice: 0,
    requiredDocuments: [
      {
        id: 'PHOTO_IDENTITE',
        label: 'Photo d\'identite',
        description: 'Photo aux normes',
        required: true,
        acceptedFormats: ['jpg', 'jpeg', 'png'],
        maxSizeMb: 5,
      },
      {
        id: 'JUSTIFICATIF_DOMICILE',
        label: 'Justificatif de domicile',
        description: 'De moins de 3 mois',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeMb: 10,
      },
      {
        id: 'ACTE_NAISSANCE',
        label: 'Acte de naissance',
        description: 'De moins de 3 mois',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeMb: 10,
      },
    ],
    subtypes: [
      { code: 'first', label: 'Premiere demande' },
      { code: 'renewal', label: 'Renouvellement' },
      { code: 'lost', label: 'Perte ou vol' },
    ],
  },

  DRIVING_LICENCE: {
    code: 'DRIVING_LICENCE',
    advercityClass: 'ProcessDrivingLicence',
    label: 'Permis de conduire',
    description: 'Renouvellement, duplicata ou echange',
    icon: 'credit-card',
    category: 'identity',
    basePrice: 4990, // 49.90 EUR
    hasTaxes: false,
    estimatedDelay: '7-10 jours ouvres',
    includedInSubscription: true,
    subscriberPrice: 0,
    requiredDocuments: [
      {
        id: 'CNI',
        label: 'Piece d\'identite',
        description: 'Carte d\'identite ou passeport',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeMb: 10,
      },
      {
        id: 'PHOTO_IDENTITE',
        label: 'Photo d\'identite',
        description: 'Photo aux normes',
        required: true,
        acceptedFormats: ['jpg', 'jpeg', 'png'],
        maxSizeMb: 5,
      },
      {
        id: 'JUSTIFICATIF_DOMICILE',
        label: 'Justificatif de domicile',
        description: 'De moins de 6 mois',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeMb: 10,
      },
    ],
    subtypes: [
      { code: 'renewal', label: 'Renouvellement' },
      { code: 'duplicate', label: 'Duplicata' },
      { code: 'international', label: 'Permis international' },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // ENTREPRISE
  // ═══════════════════════════════════════════════════════════
  KBIS: {
    code: 'KBIS',
    advercityClass: 'ProcessKBis',
    label: 'Extrait Kbis',
    description: 'Extrait du registre du commerce',
    icon: 'building',
    category: 'business',
    basePrice: 2990, // 29.90 EUR
    hasTaxes: false,
    estimatedDelay: '3-5 jours ouvres',
    includedInSubscription: true,
    subscriberPrice: 0,
    requiredDocuments: [],
  },

  // ═══════════════════════════════════════════════════════════
  // LOGEMENT
  // ═══════════════════════════════════════════════════════════
  ADDRESS_CHANGE: {
    code: 'ADDRESS_CHANGE',
    advercityClass: 'ProcessAddressChange',
    label: 'Changement d\'adresse',
    description: 'Modification d\'adresse aupres des organismes',
    icon: 'home',
    category: 'housing',
    basePrice: 1990, // 19.90 EUR
    hasTaxes: false,
    estimatedDelay: '3-5 jours ouvres',
    includedInSubscription: true,
    subscriberPrice: 0,
    requiredDocuments: [
      {
        id: 'CNI',
        label: 'Piece d\'identite',
        description: 'Carte d\'identite ou passeport',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeMb: 10,
      },
      {
        id: 'JUSTIFICATIF_DOMICILE',
        label: 'Justificatif nouveau domicile',
        description: 'Justificatif de la nouvelle adresse',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeMb: 10,
      },
    ],
  },

  CADASTRE: {
    code: 'CADASTRE',
    advercityClass: 'ProcessCadaster',
    label: 'Extrait cadastral',
    description: 'Plan cadastral de votre bien immobilier',
    icon: 'map',
    category: 'housing',
    basePrice: 2490, // 24.90 EUR
    hasTaxes: false,
    estimatedDelay: '3-5 jours ouvres',
    includedInSubscription: true,
    subscriberPrice: 0,
    requiredDocuments: [],
  },

  // ═══════════════════════════════════════════════════════════
  // JUSTICE
  // ═══════════════════════════════════════════════════════════
  CRIMINAL_RECORD: {
    code: 'CRIMINAL_RECORD',
    advercityClass: 'ProcessCriminalRecord',
    label: 'Extrait de casier judiciaire',
    description: 'Bulletin n3 du casier judiciaire',
    icon: 'scale',
    category: 'justice',
    basePrice: 1990, // Document gratuit + frais de service
    hasTaxes: false,
    estimatedDelay: '5-10 jours ouvres',
    includedInSubscription: true,
    subscriberPrice: 0,
    requiredDocuments: [
      {
        id: 'CNI',
        label: 'Piece d\'identite',
        description: 'Carte d\'identite ou passeport',
        required: true,
        acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
        maxSizeMb: 10,
      },
    ],
    subtypes: [
      { code: 'bulletin_3', label: 'Bulletin n3' },
    ],
  },
};

// ============================================================
// MAPPING ADVERCITY
// ============================================================

// Mapping type MVP -> Entity Advercity
export const PROCESS_TYPE_MAPPING: Record<ProcessType, string> = {
  REGISTRATION_CERT: 'registration_certificate',
  NON_PLEDGE_CERT: 'non_pledge_certificate',
  CRITAIR: 'critair',
  CIVIL_STATUS_BIRTH: 'civil_status_record',
  CIVIL_STATUS_MARRIAGE: 'civil_status_record',
  CIVIL_STATUS_DEATH: 'civil_status_record',
  IDENTITY_CARD: 'identity_card',
  PASSPORT: 'passport',
  DRIVING_LICENCE: 'driving_licence',
  KBIS: 'kbis',
  ADDRESS_CHANGE: 'address_change',
  CADASTRE: 'cadaster',
  CRIMINAL_RECORD: 'criminal_record',
};

// Constantes Advercity (step)
export const AdvercityStep = {
  STEP_WAITING: 0,              // En attente d'info
  STEP_UNPAID: 1,               // Opposition bancaire
  STEP_PAYED: 2,                // Paye
  STEP_VALIDATED: 3,            // Valide pour envoi
  STEP_SENDED_POST: 4,          // Envoye courrier
  STEP_SENDED_ONLINE: 5,        // Envoye en ligne
  STEP_NON_PAYED: 6,            // Non paye
  STEP_REFUNDED: 7,             // Rembourse
  STEP_ARCHIVED: 8,             // Archive
  STEP_REGULARIZATION: 9,       // Paiement complementaire
  STEP_PENDING_PAYMENT: 10,     // Paiement en attente
  STEP_WAITING_FOR_FEEDBACK: 11, // Attente retour
} as const;

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

// Mapping URL slug -> code
const URL_TO_CODE: Record<string, ProcessType> = {
  // Etat civil
  'acte-naissance': 'CIVIL_STATUS_BIRTH',
  'acte-mariage': 'CIVIL_STATUS_MARRIAGE',
  'acte-deces': 'CIVIL_STATUS_DEATH',
  // Vehicule
  'carte-grise': 'REGISTRATION_CERT',
  'certificat-immatriculation': 'REGISTRATION_CERT',
  'certificat-non-gage': 'NON_PLEDGE_CERT',
  'vignette-critair': 'CRITAIR',
  // Identite
  'carte-identite': 'IDENTITY_CARD',
  'passeport': 'PASSPORT',
  'permis-conduire': 'DRIVING_LICENCE',
  // Entreprise
  'extrait-kbis': 'KBIS',
  'kbis': 'KBIS',
  // Logement
  'changement-adresse': 'ADDRESS_CHANGE',
  'plan-cadastral': 'CADASTRE',
  'cadastre': 'CADASTRE',
  // Justice
  'casier-judiciaire': 'CRIMINAL_RECORD',
};

// Code -> URL slug
const CODE_TO_URL: Record<ProcessType, string> = {
  CIVIL_STATUS_BIRTH: 'acte-naissance',
  CIVIL_STATUS_MARRIAGE: 'acte-mariage',
  CIVIL_STATUS_DEATH: 'acte-deces',
  REGISTRATION_CERT: 'carte-grise',
  NON_PLEDGE_CERT: 'certificat-non-gage',
  CRITAIR: 'vignette-critair',
  IDENTITY_CARD: 'carte-identite',
  PASSPORT: 'passeport',
  DRIVING_LICENCE: 'permis-conduire',
  KBIS: 'extrait-kbis',
  ADDRESS_CHANGE: 'changement-adresse',
  CADASTRE: 'plan-cadastral',
  CRIMINAL_RECORD: 'casier-judiciaire',
};

export function getProcessTypeConfig(codeOrSlug: ProcessType | string): ProcessTypeConfig | undefined {
  const code = URL_TO_CODE[codeOrSlug] || codeOrSlug as ProcessType;
  return PROCESS_TYPES_CONFIG[code];
}

export function getProcessTypeFromSlug(slug: string): ProcessType | undefined {
  return URL_TO_CODE[slug];
}

export function getProcessTypeSlug(code: ProcessType): string {
  return CODE_TO_URL[code] || code.toLowerCase().replace(/_/g, '-');
}

export function getProcessTypesByCategory(category: ProcessCategory): ProcessTypeConfig[] {
  return Object.values(PROCESS_TYPES_CONFIG).filter(t => t.category === category);
}

export function getAllProcessTypes(): ProcessTypeConfig[] {
  return Object.values(PROCESS_TYPES_CONFIG);
}

export function getRequiredDocuments(type: ProcessType, formData?: Record<string, unknown>): DocumentRequirement[] {
  const config = PROCESS_TYPES_CONFIG[type];
  if (!config) return [];

  return config.requiredDocuments.filter(doc => {
    if (!doc.conditionalOn || !formData) return doc.required;

    // Verifier les conditions
    for (const [field, values] of Object.entries(doc.conditionalOn)) {
      const fieldValue = getNestedValue(formData, field);
      if (fieldValue !== undefined && values.includes(String(fieldValue))) {
        return true;
      }
    }
    return false;
  });
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' EUR';
}

export function isProcessIncludedInSubscription(type: ProcessType): boolean {
  const config = PROCESS_TYPES_CONFIG[type];
  return config?.includedInSubscription ?? false;
}
