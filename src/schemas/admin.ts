// Schemas Zod pour les actions admin

import { z } from 'zod';

// Format date YYYY-MM-DD
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format attendu : YYYY-MM-DD').optional();

// Recherche clients
export const adminUserSearchSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Recherche factures
export const adminInvoiceSearchSchema = z.object({
  search: z.string().optional(),
  type: z.enum(['SUBSCRIPTION', 'PROCESS', 'CREDIT_NOTE']).optional(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'VOID']).optional(),
  dateFrom: dateString,
  dateTo: dateString,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Recherche abonnements
export const adminSubscriptionSearchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'ENDED']).optional(),
  cardExpiring: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Recherche litiges
export const adminDisputeSearchSchema = z.object({
  status: z.enum(['NEEDS_RESPONSE', 'UNDER_REVIEW', 'WON', 'LOST']).optional(),
  dateFrom: dateString,
  dateTo: dateString,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Annulation abonnement
export const adminCancelSubscriptionSchema = z.object({
  reason: z.string().optional(),
  immediate: z.boolean().default(false),
});

// Remboursement échéances
export const adminRefundDeadlinesSchema = z.object({
  deadlineIds: z.array(z.string()).min(1, 'Sélectionnez au moins une échéance'),
  reason: z.string().optional(),
  cancelSubscription: z.boolean().default(false),
  customAmountCents: z.number().int().positive().optional(),
});

// Creation avoir
export const adminCreateCreditNoteSchema = z.object({
  invoiceId: z.string().min(1),
  amountCents: z.number().int().positive().optional(),
  reason: z.string().min(1, 'Motif requis'),
});

// Mise a jour notes litige
export const adminUpdateDisputeSchema = z.object({
  adminNotes: z.string(),
});
