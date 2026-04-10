// Classe abstraite de base pour les adaptateurs PSP

import type {
  PSPProvider,
  PSPConfig,
  CreateCustomerResult,
  CreateSubscriptionResult,
  CreateSubscriptionInput,
  CreatePaymentResult,
  CreatePaymentInput,
  CancelSubscriptionResult,
  UpdatePaymentMethodResult,
  RefundResult,
  RefundInput,
  WebhookEvent,
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
  CheckoutSessionDetails,
  InvoiceAuthDetails,
} from './types';

export abstract class BasePSPAdapter {
  protected config: PSPConfig;

  constructor(config: PSPConfig) {
    this.config = config;
  }

  abstract get provider(): PSPProvider;

  // Gestion des clients
  abstract createCustomer(email: string, metadata?: Record<string, string>): Promise<CreateCustomerResult>;
  abstract getCustomer(customerId: string): Promise<unknown>;

  // Gestion des abonnements
  abstract createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult>;
  abstract cancelSubscription(subscriptionId: string, immediately?: boolean): Promise<CancelSubscriptionResult>;
  abstract getSubscription(subscriptionId: string): Promise<unknown>;

  // Gestion des paiements
  abstract createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  abstract getPayment(paymentId: string): Promise<unknown>;
  abstract refund(input: RefundInput): Promise<RefundResult>;

  // Gestion des moyens de paiement
  abstract updatePaymentMethod(customerId: string, returnUrl: string): Promise<UpdatePaymentMethodResult>;

  // Checkout sessions
  abstract createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResult>;
  abstract retrieveCheckoutSession(sessionId: string, expandSubscription?: boolean): Promise<CheckoutSessionDetails>;
  abstract getInvoiceAuthDetails(invoiceId: string): Promise<InvoiceAuthDetails>;

  // Webhooks
  abstract verifyWebhookSignature(payload: string | Buffer, signature: string): boolean;
  abstract parseWebhookEvent(payload: string | Buffer, signature: string): WebhookEvent;

  // Helpers
  protected log(message: string, data?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PSP:${this.provider}] ${message}`, data || '');
    }
  }

  protected error(message: string, error: unknown): never {
    console.error(`[PSP:${this.provider}] ${message}`, error);
    throw new Error(`${this.provider}: ${message}`);
  }
}
