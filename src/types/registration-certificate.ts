// Types pour le certificat d'immatriculation (carte grise)

// Types d'operation alignes avec RegistrationCertificateType d'Advercity
export const OperationType = {
  CHANGEMENT_TITULAIRE: 1,   // TYPE_TITULAIRE
  CHANGEMENT_ADRESSE: 2,     // TYPE_DOMICILE
  DUPLICATA: 3,              // TYPE_DUPLICATA
  ETAT_MATRIMONIAL: 4,       // TYPE_ETAT_MATRIMONIAL (divorce, veuvage)
  ETAT_CIVIL: 5,             // TYPE_ETAT_CIVIL (changement nom/prenom)
  CHANGEMENT_PLAQUE: 6,      // TYPE_PLAQUE (FNI -> SIV)
} as const;

export type OperationTypeValue = typeof OperationType[keyof typeof OperationType];

// Etats du vehicule
export const VehicleState = {
  OCCASION: 0,
  NEUF: 1,
  IMPORT: 2,
} as const;

export type VehicleStateValue = typeof VehicleState[keyof typeof VehicleState];

// Motifs de duplicata
export const DuplicateReason = {
  VOL: 0,
  PERTE: 1,
  DETERIORATION: 2,
} as const;

export type DuplicateReasonValue = typeof DuplicateReason[keyof typeof DuplicateReason];

// Type d'immatriculation
export type RegistrationType = 'SIV' | 'FNI';

// Labels pour les types d'operation
export const operationTypeLabels: Record<OperationTypeValue, string> = {
  [OperationType.CHANGEMENT_TITULAIRE]: 'Changement de titulaire (achat/vente)',
  [OperationType.CHANGEMENT_ADRESSE]: 'Changement d\'adresse',
  [OperationType.DUPLICATA]: 'Duplicata (perte, vol, deterioration)',
  [OperationType.ETAT_MATRIMONIAL]: 'Changement d\'etat matrimonial',
  [OperationType.ETAT_CIVIL]: 'Changement d\'etat civil',
  [OperationType.CHANGEMENT_PLAQUE]: 'Changement de plaque (FNI vers SIV)',
};

export const vehicleStateLabels: Record<VehicleStateValue, string> = {
  [VehicleState.OCCASION]: 'Occasion',
  [VehicleState.NEUF]: 'Neuf',
  [VehicleState.IMPORT]: 'Import',
};

export const duplicateReasonLabels: Record<DuplicateReasonValue, string> = {
  [DuplicateReason.VOL]: 'Vol',
  [DuplicateReason.PERTE]: 'Perte',
  [DuplicateReason.DETERIORATION]: 'Deterioration',
};

// Demandeur (personne qui fait la demande)
export interface ClaimerData {
  civility: 'M' | 'MME';
  lastName: string;
  firstName: string;
  email: string;
  phone: string;
  alternativePhone?: string;
  address: string;
  additionalAddress?: string;
  zipCode: string;
  city: string;
  // Si professionnel
  company?: string;
  siren?: string;
}

// Titulaire (personne inscrite sur la carte grise)
export interface HolderData {
  sameAsClaimer: boolean;
  civility?: 'M' | 'MME';
  lastName?: string;
  firstName?: string;
  birthDate: string;  // OBLIGATOIRE SIV
  birthCity: string;  // OBLIGATOIRE SIV
  birthCountryId: number; // FK, 1=France
  address?: string;
  additionalAddress?: string;
  zipCode?: string;
  city?: string;
  // Si societe
  company?: string;
  siren?: string;
}

// Co-titulaire (optionnel)
export interface CoOwnerData {
  hasCoOwner: boolean;
  firstName?: string;
  lastName?: string;
}

// Donnees vehicule
export interface VehicleData {
  // Immatriculation (OBLIGATOIRE)
  registrationNumber: string;
  registrationType: RegistrationType;

  // Identification
  vin?: string; // Numero VIN (17 caracteres)
  certificateNumber?: string; // Numero carte grise

  // Dates
  firstRegistrationDate: string;
  currentRegistrationDate?: string;

  // Caracteristiques techniques
  vehicleTypeId: number;  // FK RegistrationCertificateVehicleType
  energyId: number;       // FK RegistrationCertificateEnergy
  fiscalPower: number;    // Puissance fiscale (CV)
  co2?: number;           // g/km, pour malus

  // Etat
  state: VehicleStateValue;
  isCollection: boolean;

  // Controle technique (vehicules > 4 ans)
  technicalControlDate?: string;

  // Departement pour calcul taxes (OBLIGATOIRE)
  departmentTaxId: number;
}

// Operation
export interface OperationData {
  typeId: OperationTypeValue;
  formerHolder?: string; // Ancien titulaire (pour changement proprietaire)
  duplicateReason?: DuplicateReasonValue; // Motif duplicata
  maxAddressChangeReached: boolean; // 3 max sur CG
}

// Consentements
export interface ConsentData {
  termsAccepted: boolean;
  dataProcessingAccepted: boolean;
  newsletterOptIn: boolean;
}

// Donnees completes formulaire carte grise
export interface RegistrationCertificateData {
  claimer: ClaimerData;
  holder: HolderData;
  coOwner?: CoOwnerData;
  vehicle: VehicleData;
  operation: OperationData;
  consents: ConsentData;
}

// Taxes carte grise
export interface RegistrationCertificateTaxes {
  taxeRegionale: number;      // Varie selon region et CV fiscaux
  taxeGestion: number;        // 11EUR fixe
  taxeAcheminement: number;   // 2,76EUR fixe
  malus: number;              // Si vehicule polluant
  serviceFee: number;         // Nos frais de service
  total: number;
}

// Types de vehicule (reference)
export interface VehicleType {
  id: number;
  label: string;
  code: string;
}

// Energies (reference)
export interface VehicleEnergy {
  id: number;
  label: string;
  code: string;
}

// Departement avec taux taxe
export interface DepartmentTax {
  id: number;
  code: string;
  name: string;
  taxRate: number; // EUR par CV
}

// Region avec taux taxe
export interface RegionTax {
  code: string;
  name: string;
  taxRatePerCV: number; // EUR par CV fiscal
}

// Baremes malus ecologique (2026)
export interface MalusThreshold {
  minCO2: number;
  maxCO2: number | null;
  amount: number; // en centimes
}
