// Types pour les demarches (processes)

export type ProcessType =
  // Etat civil
  | 'CIVIL_STATUS_BIRTH'
  | 'CIVIL_STATUS_MARRIAGE'
  | 'CIVIL_STATUS_DEATH'
  // Vehicule
  | 'REGISTRATION_CERT'
  | 'NON_PLEDGE_CERT'
  | 'CRITAIR'
  // Identite
  | 'IDENTITY_CARD'
  | 'PASSPORT'
  | 'DRIVING_LICENCE'
  // Entreprise
  | 'KBIS'
  // Logement
  | 'ADDRESS_CHANGE'
  | 'CADASTRE'
  // Justice
  | 'CRIMINAL_RECORD'
  // Vie locale
  | 'SIGNALEMENT_MAIRIE';

export type ProcessStatus =
  | 'DRAFT'
  | 'PENDING_DOCUMENTS'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_FAILED'
  | 'PAID'
  | 'SENT_TO_ADVERCITY'
  | 'IN_PROGRESS'
  | 'AWAITING_INFO'
  | 'COMPLETED'
  | 'REFUNDED'
  | 'CANCELED';

export type ActType =
  | 'FULL_COPY'
  | 'EXTRACT_WITH_FILIATION'
  | 'EXTRACT_WITHOUT_FILIATION';

export interface Process {
  id: string;
  reference: string;
  userId: string;
  type: ProcessType;
  status: ProcessStatus;
  amountCents: number;
  taxesCents: number;
  serviceFeesCents: number;
  currency: string;
  paidAt: string | null;
  pspPaymentId: string | null;
  stripePaymentIntent: string | null;
  isFromSubscription: boolean;
  data: ProcessData | RegistrationCertificateProcessData | Record<string, unknown>;
  advercityId: string | null;
  advercityRef: string | null;
  advercityStatus: number | null;
  lastSyncAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  mandatoryFileTypes: string[];
  createdAt: string;
  updatedAt: string;
}

// Donnees specifiques carte grise (stockees dans Process.data)
export interface RegistrationCertificateProcessData {
  claimer: {
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
    company?: string;
    siren?: string;
  };
  holder: {
    sameAsClaimer: boolean;
    civility?: 'M' | 'MME';
    lastName?: string;
    firstName?: string;
    birthDate: string;
    birthCity: string;
    birthCountryId: number;
    address?: string;
    additionalAddress?: string;
    zipCode?: string;
    city?: string;
    company?: string;
    siren?: string;
  };
  coOwner?: {
    hasCoOwner: boolean;
    firstName?: string;
    lastName?: string;
  };
  vehicle: {
    registrationNumber: string;
    registrationType: 'SIV' | 'FNI';
    vin?: string;
    certificateNumber?: string;
    firstRegistrationDate: string;
    currentRegistrationDate?: string;
    vehicleTypeId: number;
    energyId: number;
    fiscalPower: number;
    co2?: number;
    state: number;
    isCollection: boolean;
    technicalControlDate?: string;
    departmentTaxId: number;
  };
  operation: {
    typeId: number;
    formerHolder?: string;
    duplicateReason?: number;
    maxAddressChangeReached: boolean;
  };
}

export interface ProcessData {
  // Beneficiaire
  beneficiaryFirstName: string;
  beneficiaryLastName: string;
  beneficiaryBirthDate: string;

  // Evenement
  eventDate: string;
  eventCityId: number;
  eventCityName: string;

  // Type d'acte
  actType: ActType;

  // Livraison
  deliveryAddress: DeliveryAddress;
}

export interface DeliveryAddress {
  street: string;
  zipCode: string;
  city: string;
  country: string;
}

export interface ProcessWithFiles extends Process {
  files: ProcessFile[];
  invoice?: ProcessInvoice | null;
}

export interface ProcessFile {
  id: string;
  processId: string;
  userId: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  fileType: FileType;
  storageKey: string;
  storageUrl: string;
  thumbnailUrl: string | null;
  validationStatus: DocumentValidationStatus;
  validationNote: string | null;
  validatedAt: string | null;
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessStatusHistory {
  id: string;
  processId: string;
  fromStatus: ProcessStatus;
  toStatus: ProcessStatus;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdBy: string | null;
  createdAt: string;
}

export type FileType =
  | 'CNI'
  | 'PASSEPORT'
  | 'PERMIS'
  | 'JUSTIFICATIF_DOMICILE'
  | 'PHOTO_IDENTITE'
  | 'ACTE_NAISSANCE'
  | 'LIVRET_FAMILLE'
  | 'CARTE_GRISE'
  | 'CERTIFICAT_CESSION'
  | 'CERTIFICAT_NON_GAGE'
  | 'CONTROLE_TECHNIQUE'
  | 'MANDAT'
  | 'DECLARATION_PERTE'
  | 'AUTRE';

export type DocumentValidationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ProcessInvoice {
  id: string;
  number: string;
  totalCents: number;
  status: string;
}

export interface ProcessTimeline {
  step: string;
  label: string;
  completed: boolean;
  date?: string;
}

export interface ProcessDetail extends ProcessWithFiles {
  statusLabel: string;
  timeline: ProcessTimeline[];
}

// Input types
export interface CreateProcessInput {
  type: ProcessType;
  data: ProcessData;
  isFromSubscription?: boolean;
  stripeSessionId?: string;
}

export interface UploadFileInput {
  file: File;
  fileType: FileType;
}

// Response types
export interface ProcessListResponse {
  processes: Process[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Labels et mappings
export const processTypeLabels: Record<ProcessType, string> = {
  // Etat civil
  CIVIL_STATUS_BIRTH: 'Acte de naissance',
  CIVIL_STATUS_MARRIAGE: 'Acte de mariage',
  CIVIL_STATUS_DEATH: 'Acte de deces',
  // Vehicule
  REGISTRATION_CERT: 'Certificat d\'immatriculation',
  NON_PLEDGE_CERT: 'Certificat de non-gage',
  CRITAIR: 'Vignette Crit\'Air',
  // Identite
  IDENTITY_CARD: 'Carte d\'identite',
  PASSPORT: 'Passeport',
  DRIVING_LICENCE: 'Permis de conduire',
  // Entreprise
  KBIS: 'Extrait Kbis',
  // Logement
  ADDRESS_CHANGE: 'Changement d\'adresse',
  CADASTRE: 'Plan cadastral',
  // Justice
  CRIMINAL_RECORD: 'Casier judiciaire',
  // Vie locale
  SIGNALEMENT_MAIRIE: 'Signalement mairie',
};

export const processStatusLabels: Record<ProcessStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_DOCUMENTS: 'En attente de documents',
  PENDING_PAYMENT: 'En attente de paiement',
  PAYMENT_PROCESSING: 'Paiement en cours',
  PAYMENT_FAILED: 'Echec du paiement',
  PAID: 'Payee',
  SENT_TO_ADVERCITY: 'Envoyee',
  IN_PROGRESS: 'En cours de traitement',
  AWAITING_INFO: 'En attente d\'informations',
  COMPLETED: 'Terminee',
  REFUNDED: 'Remboursee',
  CANCELED: 'Annulee',
};

export const fileTypeLabels: Record<FileType, string> = {
  CNI: 'Carte d\'identite',
  PASSEPORT: 'Passeport',
  PERMIS: 'Permis de conduire',
  JUSTIFICATIF_DOMICILE: 'Justificatif de domicile',
  PHOTO_IDENTITE: 'Photo d\'identite',
  ACTE_NAISSANCE: 'Acte de naissance',
  LIVRET_FAMILLE: 'Livret de famille',
  CARTE_GRISE: 'Ancienne carte grise',
  CERTIFICAT_CESSION: 'Certificat de cession',
  CERTIFICAT_NON_GAGE: 'Certificat de non-gage',
  CONTROLE_TECHNIQUE: 'Controle technique',
  MANDAT: 'Mandat',
  DECLARATION_PERTE: 'Declaration de perte/vol',
  AUTRE: 'Autre document',
};
