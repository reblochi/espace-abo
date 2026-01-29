// Client API Advercity

import axios, { type AxiosInstance } from 'axios';

// Types pour l'API Advercity
interface AdvercityProcessInput {
  type: string;
  external_reference: string;
  webhook_url: string;
  data: Record<string, unknown>;
}

interface AdvercityProcessResponse {
  advercity_id: string;
  advercity_reference: string;
  status: string;
}

interface AdvercityCitySearchResult {
  id: number;
  name: string;
  postal_code: string;
  department_code: string;
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

// Rechercher des communes
export async function searchCities(query: string, limit: number = 10): Promise<AdvercityCitySearchResult[]> {
  const response = await advercityClient.get<AdvercityCitySearchResult[]>(
    '/api/cities/search',
    {
      params: { q: query, limit },
    }
  );
  return response.data;
}

// Recuperer une commune par ID
export async function getCityById(id: number): Promise<AdvercityCitySearchResult | null> {
  try {
    const response = await advercityClient.get<AdvercityCitySearchResult>(
      `/api/cities/${id}`
    );
    return response.data;
  } catch {
    return null;
  }
}

// Mapper les types de demarche vers Advercity
export function mapProcessTypeToAdvercity(type: string): string {
  const mapping: Record<string, string> = {
    CIVIL_STATUS_BIRTH: 'civil_status_record',
    CIVIL_STATUS_MARRIAGE: 'civil_status_record',
    CIVIL_STATUS_DEATH: 'civil_status_record',
    CRIMINAL_RECORD: 'criminal_record',
    REGISTRATION_CERT: 'registration_certificate',
    KBIS: 'kbis',
  };
  return mapping[type] || 'civil_status_record';
}

// Mapper les donnees d'une demarche vers le format Advercity
export function mapProcessDataToAdvercity(
  type: string,
  data: Record<string, unknown>,
  user: { email: string; firstName: string; lastName: string }
): Record<string, unknown> {
  // Mapping specifique selon le type
  switch (type) {
    case 'CIVIL_STATUS_BIRTH':
      return {
        civilStatusRecordType: 1, // TYPE_BIRTH
        birthCity: { id: data.eventCityId },
        birthDate: data.eventDate,
        firstName: data.beneficiaryFirstName,
        lastName: data.beneficiaryLastName,
        customer: {
          firstName: user.firstName,
          lastName: user.lastName,
          mail: user.email,
        },
        deliveryAddress: data.deliveryAddress,
      };

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
        },
        deliveryAddress: data.deliveryAddress,
      };

    default:
      return data;
  }
}

// Mapper les statuts Advercity vers nos statuts
export function mapAdvercityStatusToProcessStatus(step: number): ProcessStatus {
  const mapping: Record<number, ProcessStatus> = {
    0: 'PENDING_PAYMENT',
    1: 'PAID',
    2: 'SENT_TO_ADVERCITY',
    3: 'IN_PROGRESS',
    4: 'COMPLETED',
    5: 'REFUNDED',
    6: 'COMPLETED',
  };
  return mapping[step] || 'IN_PROGRESS';
}

type ProcessStatus = 'PENDING_PAYMENT' | 'PAID' | 'SENT_TO_ADVERCITY' | 'IN_PROGRESS' | 'COMPLETED' | 'REFUNDED' | 'CANCELED';
