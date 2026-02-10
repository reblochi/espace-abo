// Client API Advercity

import axios, { type AxiosInstance } from 'axios';
import type { ProcessStatus, ProcessType, RegistrationCertificateProcessData } from '@/types';
import { PROCESS_TYPE_MAPPING, AdvercityStep } from './process-types';
import { mapToAdvercityPayload, type RegistrationCertificateInput } from '@/schemas/registration-certificate';
import { mapBirthCertificateToAdvercity, type BirthCertificateInput } from '@/schemas/birth-certificate';

// Types pour l'API Advercity
export interface AdvercityProcessInput {
  type: string;
  external_reference: string;
  webhook_url: string;
  data: Record<string, unknown>;
  documents?: { type: string; url: string }[];
  customer_data?: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

export interface AdvercityProcessResponse {
  advercity_id: string;
  advercity_reference: string;
  status: number;
}

export interface AdvercityCitySearchResult {
  id: number;
  name: string;
  postal_code: string;
  department_code: string;
}

export interface AdvercityDepartmentTax {
  id: number;
  code: string;
  name: string;
  tax_rate: number;
}

export interface AdvercityVehicleType {
  id: number;
  label: string;
  code: string;
}

export interface AdvercityVehicleEnergy {
  id: number;
  label: string;
  code: string;
}

// Client Axios configure
const createAdvercityClient = (): AxiosInstance => {
  return axios.create({
    baseURL: process.env.ADVERCITY_API_URL,
    headers: {
      'Authorization': `Bearer ${process.env.ADVERCITY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 secondes
  });
};

export const advercityClient = createAdvercityClient();

// Helper pour les requetes GraphQL
interface GraphQLResponse<T> {
  data: T;
  errors?: { message: string }[];
}

async function graphqlQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await advercityClient.post<GraphQLResponse<T>>(
    '/api/v1/',
    { query, variables }
  );
  if (response.data.errors?.length) {
    throw new Error(response.data.errors[0].message);
  }
  return response.data.data;
}

// ============================================================
// CREATION DE DEMARCHES
// ============================================================

// Creer une demarche dans Advercity
export async function createAdvercityProcess(
  input: AdvercityProcessInput
): Promise<AdvercityProcessResponse> {
  const response = await advercityClient.post<AdvercityProcessResponse>(
    '/api/external/process',
    input
  );
  return response.data;
}

// ============================================================
// RECHERCHE COMMUNES / REFERENTIELS (GraphQL)
// ============================================================

// Rechercher des communes via l'API Advercity (table city interne)
export async function searchCities(query: string, limit: number = 10): Promise<AdvercityCitySearchResult[]> {
  try {
    const response = await advercityClient.get<AdvercityCitySearchResult[]>(
      '/api/external/cities',
      { params: { q: query.trim(), limit } }
    );
    return response.data || [];
  } catch {
    return [];
  }
}

// Recuperer une commune par ID Advercity
export async function getCityById(id: number): Promise<AdvercityCitySearchResult | null> {
  try {
    const response = await advercityClient.get<AdvercityCitySearchResult[]>(
      '/api/external/cities',
      { params: { id } }
    );
    return response.data?.[0] || null;
  } catch {
    return null;
  }
}

// Recuperer les departements avec taux de taxe
export async function getDepartmentTaxes(): Promise<AdvercityDepartmentTax[]> {
  try {
    const response = await advercityClient.get<AdvercityDepartmentTax[]>(
      '/api/reference/department-taxes'
    );
    return response.data;
  } catch {
    return [];
  }
}

// Recuperer les types de vehicules
export async function getVehicleTypes(): Promise<AdvercityVehicleType[]> {
  try {
    const response = await advercityClient.get<AdvercityVehicleType[]>(
      '/api/reference/vehicle-types'
    );
    return response.data;
  } catch {
    return [];
  }
}

// Recuperer les energies
export async function getVehicleEnergies(): Promise<AdvercityVehicleEnergy[]> {
  try {
    const response = await advercityClient.get<AdvercityVehicleEnergy[]>(
      '/api/reference/vehicle-energies'
    );
    return response.data;
  } catch {
    return [];
  }
}

// ============================================================
// MAPPING TYPES / DONNEES
// ============================================================

// Mapper les types de demarche vers Advercity
export function mapProcessTypeToAdvercity(type: ProcessType | string): string {
  return PROCESS_TYPE_MAPPING[type as ProcessType] || 'civil_status_record';
}

// Mapper les donnees d'une demarche vers le format Advercity
export function mapProcessDataToAdvercity(
  type: ProcessType | string,
  data: Record<string, unknown>,
  user: { email: string; firstName: string; lastName: string; phone?: string }
): Record<string, unknown> {
  // Mapping specifique selon le type
  switch (type) {
    case 'CIVIL_STATUS_BIRTH':
      return mapBirthCertificateToAdvercity(data as unknown as BirthCertificateInput, user);

    case 'CIVIL_STATUS_MARRIAGE':
      return {
        civilStatusRecordType: 2, // TYPE_MARRIAGE
        marriageCity: { id: data.eventCityId },
        marriageDate: data.eventDate,
        spouseFirstName: data.beneficiaryFirstName,
        spouseLastName: data.beneficiaryLastName,
        customer: {
          firstName: user.firstName,
          lastName: user.lastName,
          mail: user.email,
          phone: user.phone,
        },
        deliveryAddress: data.deliveryAddress,
      };

    case 'CIVIL_STATUS_DEATH':
      return {
        civilStatusRecordType: 3, // TYPE_DEATH
        deathCity: { id: data.eventCityId },
        deathDate: data.eventDate,
        deceasedFirstName: data.beneficiaryFirstName,
        deceasedLastName: data.beneficiaryLastName,
        customer: {
          firstName: user.firstName,
          lastName: user.lastName,
          mail: user.email,
          phone: user.phone,
        },
        deliveryAddress: data.deliveryAddress,
      };

    case 'REGISTRATION_CERT':
      // Utiliser le mapper specifique pour carte grise
      return mapToAdvercityPayload(data as unknown as RegistrationCertificateInput);

    case 'NON_PLEDGE_CERT':
      return {
        vehicleRegistrationNumber: (data as RegistrationCertificateProcessData).vehicle?.registrationNumber,
        customer: {
          firstName: user.firstName,
          lastName: user.lastName,
          mail: user.email,
          phone: user.phone,
        },
      };

    case 'CRITAIR':
      return {
        vehicleRegistrationNumber: (data as RegistrationCertificateProcessData).vehicle?.registrationNumber,
        deliveryAddress: data.deliveryAddress,
        customer: {
          firstName: user.firstName,
          lastName: user.lastName,
          mail: user.email,
          phone: user.phone,
        },
      };

    case 'CRIMINAL_RECORD':
      return {
        bulletinType: 3, // Bulletin n3
        customer: {
          firstName: user.firstName,
          lastName: user.lastName,
          mail: user.email,
          phone: user.phone,
          birthDate: data.birthDate,
          birthCity: data.birthCity,
        },
      };

    case 'KBIS':
      return {
        siret: data.siret,
        customer: {
          firstName: user.firstName,
          lastName: user.lastName,
          mail: user.email,
          phone: user.phone,
        },
      };

    default:
      return {
        ...data,
        customer: {
          firstName: user.firstName,
          lastName: user.lastName,
          mail: user.email,
          phone: user.phone,
        },
      };
  }
}

// ============================================================
// MAPPING STATUTS
// ============================================================

// Mapper les statuts Advercity vers nos statuts
export function mapAdvercityStatusToProcessStatus(step: number): ProcessStatus {
  const mapping: Record<number, ProcessStatus> = {
    [AdvercityStep.STEP_WAITING]: 'AWAITING_INFO',
    [AdvercityStep.STEP_UNPAID]: 'PAYMENT_FAILED',
    [AdvercityStep.STEP_PAYED]: 'SENT_TO_ADVERCITY',
    [AdvercityStep.STEP_VALIDATED]: 'IN_PROGRESS',
    [AdvercityStep.STEP_SENDED_POST]: 'COMPLETED',
    [AdvercityStep.STEP_SENDED_ONLINE]: 'COMPLETED',
    [AdvercityStep.STEP_NON_PAYED]: 'PENDING_PAYMENT',
    [AdvercityStep.STEP_REFUNDED]: 'REFUNDED',
    [AdvercityStep.STEP_ARCHIVED]: 'COMPLETED',
    [AdvercityStep.STEP_REGULARIZATION]: 'AWAITING_INFO',
    [AdvercityStep.STEP_PENDING_PAYMENT]: 'PAYMENT_PROCESSING',
    [AdvercityStep.STEP_WAITING_FOR_FEEDBACK]: 'IN_PROGRESS',
  };
  return mapping[step] || 'IN_PROGRESS';
}

// Mapper nos statuts vers un label lisible
export function getAdvercityStepLabel(step: number): string {
  const labels: Record<number, string> = {
    [AdvercityStep.STEP_WAITING]: 'En attente d\'informations',
    [AdvercityStep.STEP_UNPAID]: 'Paiement refuse',
    [AdvercityStep.STEP_PAYED]: 'Paye - En attente de traitement',
    [AdvercityStep.STEP_VALIDATED]: 'Valide - En cours d\'envoi',
    [AdvercityStep.STEP_SENDED_POST]: 'Envoye par courrier',
    [AdvercityStep.STEP_SENDED_ONLINE]: 'Envoye en ligne',
    [AdvercityStep.STEP_NON_PAYED]: 'En attente de paiement',
    [AdvercityStep.STEP_REFUNDED]: 'Rembourse',
    [AdvercityStep.STEP_ARCHIVED]: 'Archive',
    [AdvercityStep.STEP_REGULARIZATION]: 'Regularisation requise',
    [AdvercityStep.STEP_PENDING_PAYMENT]: 'Paiement en cours de validation',
    [AdvercityStep.STEP_WAITING_FOR_FEEDBACK]: 'En attente de retour',
  };
  return labels[step] || `Etape ${step}`;
}

// ============================================================
// WEBHOOKS
// ============================================================

export interface AdvercityWebhookPayload {
  event: string;
  external_reference: string;
  advercity_reference: string;
  advercity_id: string | number;
  timestamp: string;
}

export interface ProcessStepChangedWebhook extends AdvercityWebhookPayload {
  event: 'process.step_changed';
  old_step: number;
  new_step: number;
  step_label: string;
}

export interface ProcessCompletedWebhook extends AdvercityWebhookPayload {
  event: 'process.completed';
  completion_type: 'sent_post' | 'sent_online';
  tracking_number?: string;
}

export interface ProcessErrorWebhook extends AdvercityWebhookPayload {
  event: 'process.error';
  error_code: string;
  error_message: string;
  requires_action: boolean;
}

export interface ProcessAwaitingInfoWebhook extends AdvercityWebhookPayload {
  event: 'process.awaiting_info';
  required_documents: string[];
  message: string;
}

export type AdvercityWebhookEvent =
  | ProcessStepChangedWebhook
  | ProcessCompletedWebhook
  | ProcessErrorWebhook
  | ProcessAwaitingInfoWebhook;

// Verifier la signature du webhook
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return signature === expectedSignature;
}
