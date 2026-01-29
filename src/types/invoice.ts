// Types pour les factures

export type InvoiceType =
  | 'SUBSCRIPTION'
  | 'PROCESS'
  | 'CREDIT_NOTE';

export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PAID'
  | 'VOID';

export interface Invoice {
  id: string;
  number: string;
  userId: string;
  type: InvoiceType;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  taxRate: number;
  status: InvoiceStatus;
  paidAt: string | Date | null;
  processId: string | null;
  deadlineId: string | null;
  pdfUrl: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface InvoiceWithRelations extends Invoice {
  process?: {
    reference: string;
    type: string;
  } | null;
  deadline?: {
    deadlineNumber: number;
  } | null;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    address: string | null;
    zipCode: string | null;
    city: string | null;
  };
}

export interface InvoiceListResponse {
  invoices: InvoiceWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Labels
export const invoiceTypeLabels: Record<InvoiceType, string> = {
  SUBSCRIPTION: 'Abonnement',
  PROCESS: 'Demarche',
  CREDIT_NOTE: 'Avoir',
};

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyee',
  PAID: 'Payee',
  VOID: 'Annulee',
};
