// Schemas Zod pour les abonnements

import { z } from 'zod';

// Schema creation abonnement
export const createSubscriptionSchema = z.object({
  priceId: z.string().min(1, 'ID du prix requis'),
  paymentMethodId: z.string().min(1, 'Methode de paiement requise'),
});

export type CreateSubscriptionSchema = z.infer<typeof createSubscriptionSchema>;

// Schema annulation abonnement
export const cancelSubscriptionSchema = z.object({
  reason: z.string().optional(),
  immediate: z.boolean().default(false),
});

export type CancelSubscriptionSchema = z.infer<typeof cancelSubscriptionSchema>;

// Schema validation statut
export const subscriptionStatusSchema = z.enum([
  'PENDING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'ENDED',
]);

export type SubscriptionStatusSchema = z.infer<typeof subscriptionStatusSchema>;
