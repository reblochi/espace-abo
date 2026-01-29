// Types pour l'architecture Multi-PSP

export type PSPProvider = 'stripe' | 'hipay' | 'payzen' | 'mangopay';

// Resultat creation client
export interface CreateCustomerResult {
  customerId: string;
  provider: PSPProvider;
}

// Resultat creation abonnement
export interface CreateSubscriptionResult {
  subscriptionId: string;
  customerId: string;
  status: 'active' | 'pending' | 'incomplete';
  clientSecret?: string;  // Pour finalisation cote client (Stripe)
  redirectUrl?: string;   // Pour redirection (HiPay, Payzen)
  provider: PSPProvider;
}

// Resultat paiement unique
export interface CreatePaymentResult {
  paymentId: string;
  status: 'succeeded' | 'pending' | 'requires_action' | 'failed';
  clientSecret?: string;
  redirectUrl?: string;
  provider: PSPProvider;
}

// Resultat annulation
export interface CancelSubscriptionResult {
  success: boolean;
  canceledAt: Date;
  endDate?: Date;  // Date de fin des droits
}

// Resultat changement CB
export interface UpdatePaymentMethodResult {
  success: boolean;
  redirectUrl?: string;  // Certains PSP redirigent vers une page
}

// Resultat remboursement
export interface RefundResult {
  refundId: string;
  status: 'succeeded' | 'pending' | 'failed';
  amountCents: number;
}

// Evenement webhook normalise
export interface WebhookEvent {
  type: WebhookEventType;
  provider: PSPProvider;
  data: {
    subscriptionId?: string;
    customerId?: string;
    paymentId?: string;
    invoiceId?: string;
    amountCents?: number;
    status?: string;
    failureReason?: string;
    externalReference?: string;
  };
  rawEvent: unknown;
}

export type WebhookEventType =
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'subscription.deleted'
  | 'invoice.created'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.refunded'
  | 'customer.created'
  | 'customer.updated';

// Configuration PSP
export interface PSPConfig {
  provider: PSPProvider;
  apiKey: string;
  webhookSecret: string;
  publicKey?: string;
  sandbox?: boolean;
  extraConfig?: Record<string, unknown>;
}

// Input creation abonnement
export interface CreateSubscriptionInput {
  customerId?: string;  // Optionnel si on cree le client en meme temps
  email: string;
  priceId: string;  // ID du plan/prix cote PSP
  paymentMethodId?: string;  // Requis pour Stripe
  metadata?: Record<string, string>;
}

// Input paiement unique
export interface CreatePaymentInput {
  amountCents: number;
  currency: string;
  customerId?: string;
  email: string;
  description: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
  returnUrl?: string;  // Pour redirections
}

// Input remboursement
export interface RefundInput {
  paymentId: string;
  amountCents?: number;  // Optionnel pour remboursement partiel
  reason?: string;
}
