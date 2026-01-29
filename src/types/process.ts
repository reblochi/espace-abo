// Types pour les demarches (processes)

export type ProcessType =
  | 'CIVIL_STATUS_BIRTH'
  | 'CIVIL_STATUS_MARRIAGE'
  | 'CIVIL_STATUS_DEATH'
  | 'CRIMINAL_RECORD'
  | 'REGISTRATION_CERT'
  | 'KBIS'
  | 'ADDRESS_CHANGE'
  | 'NON_PLEDGE_CERT'
  | 'PASSPORT'
  | 'IDENTITY_CARD'
  | 'CADASTRE'
  | 'CRITAIR';

export type ProcessStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'SENT_TO_ADVERCITY'
  | 'IN_PROGRESS'
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
  currency: string;
  paidAt: string | null;
  pspPaymentId: string | null;
  isFromSubscription: boolean;
  data: ProcessData;
  advercityId: string | null;
  advercityRef: string | null;
  advercityStatus: number | null;
  lastSyncAt: string | null;
  mandatoryFileTypes: string[];
  createdAt: string;
  updatedAt: string;
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
  storageUrl: string;
  thumbnailUrl: string | null;
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type FileType =
  | 'CNI'
  | 'PASSEPORT'
  | 'PERMIS'
  | 'JUSTIFICATIF_DOMICILE'
  | 'PHOTO_IDENTITE'
  | 'ACTE_NAISSANCE'
  | 'LIVRET_FAMILLE'
  | 'AUTRE';

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
  CIVIL_STATUS_BIRTH: 'Acte de naissance',
  CIVIL_STATUS_MARRIAGE: 'Acte de mariage',
  CIVIL_STATUS_DEATH: 'Acte de deces',
  CRIMINAL_RECORD: 'Casier judiciaire',
  REGISTRATION_CERT: 'Carte grise',
  KBIS: 'Extrait Kbis',
  ADDRESS_CHANGE: 'Changement d\'adresse',
  NON_PLEDGE_CERT: 'Certificat de non-gage',
  PASSPORT: 'Passeport',
  IDENTITY_CARD: 'Carte d\'identite',
  CADASTRE: 'Plan cadastral',
  CRITAIR: 'Vignette Crit\'Air',
};

export const processStatusLabels: Record<ProcessStatus, string> = {
  PENDING_PAYMENT: 'En attente de paiement',
  PAID: 'Payee',
  SENT_TO_ADVERCITY: 'Envoyee',
  IN_PROGRESS: 'En cours de traitement',
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
  AUTRE: 'Autre document',
};
