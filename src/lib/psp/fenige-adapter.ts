// Adaptateur Fenige PayTool (hosted payment page)
// Doc: https://paytool-api-dev.fenige.pl/paymenthub-documentation.html

import crypto from 'crypto';
import { BasePSPAdapter } from './base-adapter';
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
  WebhookEventType,
} from './types';

// --- Types PayTool API ---

interface PayToolPreInitResponse {
  transactionId: string;
}

interface PayToolPaymelinkResponse {
  value: string; // URL de la page de paiement
  transactionId: string;
  expirationTime: number;
}

interface PayToolTransactionDetails {
  requestUuid: string;
  transactionId: string;
  cofInitialUuid?: string;
  creationDate: string;
  transactionStatus: 'IN_PROGRESS' | 'SUCCESS' | 'FAILURE' | 'SUCCESS_WAITING_FOR_CLEARING' | 'REVERSED' | 'REFUNDED';
  responseCode?: string;
  clearingStatus?: string;
  clearingDate?: string;
  hiddenCardNumber?: string;
  provider?: string;
  bankName?: string;
  amount: number;
  currency: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  refunds?: Array<{ refundId: string; amount: number; status: string }>;
}

interface PayToolCofSubsequentResponse {
  transactionId: string;
  transactionStatus: 'SUCCESS' | 'FAILURE';
}

interface PayToolRefundResponse {
  transactionStatus: 'SUCCESS' | 'FAILURE';
}

interface PayToolReverseResponse {
  transactionStatus: 'SUCCESS' | 'FAILURE';
}

interface FenigeWebhookPayload {
  transactionId: string;
  transactionStatus?: string;
  clearingStatus?: string;
  amount?: number;
  currency?: string;
  responseCode?: string;
  cofInitialUuid?: string;
}

export class FenigeAdapter extends BasePSPAdapter {
  private apiUrl: string;
  private paymentPageUrl: string;
  private merchantUuid: string;
  private apiKeyHeader: string;
  private basicAuthHeader: string;

  constructor(config: PSPConfig) {
    super(config);

    this.apiUrl = config.sandbox
      ? 'https://paytool-api-dev.fenige.pl'
      : (config.extraConfig?.productionApiUrl as string || 'https://paytool-api.fenige.pl');

    this.paymentPageUrl = config.sandbox
      ? 'https://paytool-dev.fenige.pl'
      : (config.extraConfig?.productionPageUrl as string || 'https://paytool.fenige.pl');

    this.merchantUuid = config.extraConfig?.merchantUuid as string;

    // API-KEY header pour les operations publiques (pre-init, paymelink)
    this.apiKeyHeader = config.publicKey || '';

    // Basic Auth pour les operations securisees (details, refund, clear, cof subsequent)
    const credentials = Buffer.from(`${config.extraConfig?.basicAuthUser}:${config.extraConfig?.basicAuthPassword}`).toString('base64');
    this.basicAuthHeader = `Basic ${credentials}`;
  }

  get provider(): PSPProvider {
    return 'fenige';
  }

  // --- HTTP helpers ---

  private async requestWithApiKey<T>(method: string, path: string, body?: unknown): Promise<T> {
    return this.doRequest<T>(method, path, { 'API-KEY': this.apiKeyHeader }, body);
  }

  private async requestWithBasicAuth<T>(method: string, path: string, body?: unknown): Promise<T> {
    return this.doRequest<T>(method, path, { 'Authorization': this.basicAuthHeader }, body);
  }

  private async doRequest<T>(method: string, path: string, authHeaders: Record<string, string>, body?: unknown): Promise<T> {
    const url = `${this.apiUrl}${path}`;
    this.log(`${method} ${path}`, body);

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
      this.error(`PayTool API error ${res.status}`, data);
    }

    this.log(`Response ${path}`, data);
    return data as T;
  }

  // --- Clients ---
  // PayTool n'a pas de concept de client persistant.

  async createCustomer(email: string, metadata?: Record<string, string>): Promise<CreateCustomerResult> {
    const customerId = `fenige_${crypto.createHash('sha256').update(email).digest('hex').slice(0, 16)}`;
    return {
      customerId,
      provider: this.provider,
    };
  }

  async getCustomer(customerId: string): Promise<unknown> {
    return { customerId };
  }

  // --- Abonnements ---
  // PayTool gere le recurrent via CoF (Card on File):
  // 1. Transaction initiale avec typeOfAuthorization: "COF" → retourne cofInitialUuid
  // 2. Paiements subsequent via /external/transactions/cof/subsequent

  async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
    try {
      const amountCents = parseInt(input.metadata?.amountCents || '990');
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

      // Pre-initialiser la transaction CoF
      const preInit = await this.requestWithApiKey<PayToolPreInitResponse>(
        'POST',
        '/transactions/pre-initialization',
        {
          currencyCode: 'EUR',
          amount: amountCents,
          receiverAmount: amountCents,
          transactionRef: (input.metadata?.transactionRef || `sub_${Date.now()}`).slice(0, 20),
          description: 'Abonnement mensuel SAF SERVICE',
          orderNumber: input.metadata?.orderNumber || `SUB-${Date.now()}`,
          formLanguage: 'fr',
          redirectUrl: {
            successUrl: input.metadata?.successUrl || `${appUrl}/espace-membre/mon-abonnement?status=success`,
            failureUrl: input.metadata?.failureUrl || `${appUrl}/espace-membre/mon-abonnement?status=failure`,
            cancelUrl: input.metadata?.cancelUrl || `${appUrl}/espace-membre/mon-abonnement?status=cancel`,
          },
          sender: {
            firstName: input.metadata?.firstName || '',
            lastName: input.metadata?.lastName || '',
            email: input.email,
            address: input.metadata?.address ? JSON.parse(input.metadata.address) : undefined,
          },
          autoClear: true,
          typeOfAuthorization: 'COF',
          countryOfResidence: input.metadata?.countryCode || 'FR',
          allowedPaymentMethods: ['CARD'],
          merchantUuid: this.merchantUuid,
        }
      );

      // Generer le lien de paiement
      const paymelink = await this.requestWithApiKey<PayToolPaymelinkResponse>(
        'POST',
        '/external-api/paymelink',
        {
          preInitData: {
            transactionId: preInit.transactionId,
            currencyCode: 'EUR',
            amount: amountCents,
            receiverAmount: amountCents,
            description: 'Abonnement mensuel SAF SERVICE',
            orderNumber: input.metadata?.orderNumber || `SUB-${Date.now()}`,
            redirectUrl: {
              successUrl: input.metadata?.successUrl || `${appUrl}/espace-membre/mon-abonnement?status=success`,
              failureUrl: input.metadata?.failureUrl || `${appUrl}/espace-membre/mon-abonnement?status=failure`,
              cancelUrl: input.metadata?.cancelUrl || `${appUrl}/espace-membre/mon-abonnement?status=cancel`,
            },
            formLanguage: 'fr',
            sender: {
              firstName: input.metadata?.firstName || '',
              lastName: input.metadata?.lastName || '',
              email: input.email,
            },
            autoClear: true,
            merchantUuid: this.merchantUuid,
            countryOfResidence: input.metadata?.countryCode || 'FR',
            allowedPaymentMethods: ['CARD'],
          },
        }
      );

      return {
        subscriptionId: preInit.transactionId,
        customerId: input.customerId || input.email,
        status: 'pending',
        redirectUrl: paymelink.value,
        provider: this.provider,
      };
    } catch (error) {
      this.error('Erreur creation abonnement Fenige', error);
    }
  }

  /**
   * Paiement recurrent subsequent via CoF (Card on File).
   * Utilise le cofInitialUuid obtenu lors du premier paiement.
   */
  async chargeRecurring(params: {
    cofInitialUuid: string;
    amountCents: number;
    transactionRef: string;
  }): Promise<PayToolCofSubsequentResponse> {
    const transactionId = crypto.randomUUID();

    return this.requestWithBasicAuth<PayToolCofSubsequentResponse>(
      'POST',
      '/external/transactions/cof/subsequent',
      {
        cofInitialUuid: params.cofInitialUuid,
        transactionId,
        currencyCode: 'EUR',
        amount: String(params.amountCents),
        language: 'fr-FR',
        autoClear: 'true',
      }
    );
  }

  async cancelSubscription(subscriptionId: string, immediately = false): Promise<CancelSubscriptionResult> {
    // PayTool n'a pas de concept d'abonnement cote PSP.
    // L'annulation est geree localement — on arrete de debiter via CoF.
    return {
      success: true,
      canceledAt: new Date(),
      endDate: immediately ? new Date() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  async getSubscription(subscriptionId: string): Promise<unknown> {
    return this.getPayment(subscriptionId);
  }

  // --- Paiements ---

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

      // Pre-initialiser la transaction
      const preInit = await this.requestWithApiKey<PayToolPreInitResponse>(
        'POST',
        '/transactions/pre-initialization',
        {
          currencyCode: input.currency.toUpperCase(),
          amount: input.amountCents,
          receiverAmount: input.amountCents,
          transactionRef: (input.metadata?.transactionRef || `pay_${Date.now()}`).slice(0, 20),
          description: input.description,
          orderNumber: input.metadata?.orderNumber || input.metadata?.processReference || `PAY-${Date.now()}`,
          formLanguage: 'fr',
          redirectUrl: {
            successUrl: input.metadata?.successUrl || input.returnUrl || `${appUrl}/paiement/succes`,
            failureUrl: input.metadata?.failureUrl || input.returnUrl || `${appUrl}/paiement/echec`,
            cancelUrl: input.metadata?.cancelUrl || input.returnUrl || `${appUrl}/paiement/annule`,
          },
          sender: {
            firstName: input.metadata?.firstName || '',
            lastName: input.metadata?.lastName || '',
            email: input.email,
            address: input.metadata?.address ? JSON.parse(input.metadata.address) : undefined,
          },
          autoClear: true,
          typeOfAuthorization: 'PURCHASE',
          countryOfResidence: input.metadata?.countryCode || 'FR',
          allowedPaymentMethods: ['CARD'],
          merchantUuid: this.merchantUuid,
          additionalData: input.metadata ? { note: JSON.stringify(input.metadata) } : undefined,
        }
      );

      // Generer le lien de paiement
      const paymelink = await this.requestWithApiKey<PayToolPaymelinkResponse>(
        'POST',
        '/external-api/paymelink',
        {
          preInitData: {
            transactionId: preInit.transactionId,
            currencyCode: input.currency.toUpperCase(),
            amount: input.amountCents,
            receiverAmount: input.amountCents,
            description: input.description,
            orderNumber: input.metadata?.orderNumber || input.metadata?.processReference || `PAY-${Date.now()}`,
            redirectUrl: {
              successUrl: input.metadata?.successUrl || input.returnUrl || `${appUrl}/paiement/succes`,
              failureUrl: input.metadata?.failureUrl || input.returnUrl || `${appUrl}/paiement/echec`,
              cancelUrl: input.metadata?.cancelUrl || input.returnUrl || `${appUrl}/paiement/annule`,
            },
            formLanguage: 'fr',
            sender: {
              firstName: input.metadata?.firstName || '',
              lastName: input.metadata?.lastName || '',
              email: input.email,
            },
            autoClear: true,
            merchantUuid: this.merchantUuid,
            countryOfResidence: input.metadata?.countryCode || 'FR',
            allowedPaymentMethods: ['CARD'],
          },
        }
      );

      return {
        paymentId: preInit.transactionId,
        status: 'pending',
        redirectUrl: paymelink.value,
        provider: this.provider,
      };
    } catch (error) {
      this.error('Erreur creation paiement Fenige', error);
    }
  }

  async getPayment(paymentId: string): Promise<PayToolTransactionDetails> {
    return this.requestWithBasicAuth<PayToolTransactionDetails>(
      'GET',
      `/transactions/details/${paymentId}`
    );
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    try {
      const response = await this.requestWithBasicAuth<PayToolRefundResponse>(
        'POST',
        '/external/transaction/refund',
        {
          transactionId: input.paymentId,
          amountToRefund: input.amountCents,
        }
      );

      return {
        refundId: `refund_${input.paymentId}`,
        status: response.transactionStatus === 'SUCCESS' ? 'succeeded' : 'failed',
        amountCents: input.amountCents || 0,
      };
    } catch (error) {
      this.error('Erreur remboursement Fenige', error);
    }
  }

  // --- Changement CB ---

  async updatePaymentMethod(customerId: string, returnUrl: string): Promise<UpdatePaymentMethodResult> {
    // PayTool n'a pas de portail de gestion de CB.
    // On cree une nouvelle transaction CoF initiale pour enregistrer la nouvelle carte.
    // Redirige vers une page interne qui declenche un nouveau paiement CoF de 0 EUR
    // ou un montant symbolique.
    return {
      success: true,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/espace-membre/mon-abonnement/changer-carte?return=${encodeURIComponent(returnUrl)}`,
    };
  }

  // --- Reversal (annulation avant clearing) ---

  async reversal(transactionId: string): Promise<PayToolReverseResponse> {
    return this.requestWithBasicAuth<PayToolReverseResponse>(
      'POST',
      '/external/reverse',
      {
        transactionId,
        merchantUuid: this.merchantUuid,
      }
    );
  }

  // --- Clearing manuel ---

  async clearing(transactionId: string, amountCents: number): Promise<{ transactionStatus: string }> {
    return this.requestWithBasicAuth<{ transactionStatus: string }>(
      'POST',
      '/external/clear',
      {
        transactionId,
        merchantUuid: this.merchantUuid,
        clearingAmount: amountCents,
      }
    );
  }

  // --- Webhooks ---
  // Signature: X-SECRET-CHECKSUM = SHA256(secret_token + transactionId)

  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    if (!this.config.webhookSecret) return true;

    const data: FenigeWebhookPayload = JSON.parse(payload.toString());
    const expected = crypto
      .createHash('sha256')
      .update(this.config.webhookSecret + data.transactionId)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature.toLowerCase()),
        Buffer.from(expected.toLowerCase())
      );
    } catch {
      return false;
    }
  }

  parseWebhookEvent(payload: string | Buffer, signature: string): WebhookEvent {
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Signature webhook Fenige invalide');
    }

    const data: FenigeWebhookPayload = JSON.parse(payload.toString());

    return {
      type: this.mapWebhookEventType(data),
      provider: this.provider,
      data: {
        paymentId: data.transactionId,
        amountCents: data.amount,
        status: data.transactionStatus || data.clearingStatus,
        metadata: data.cofInitialUuid ? { cofInitialUuid: data.cofInitialUuid } : undefined,
      },
      rawEvent: data,
    };
  }

  // --- Mappers internes ---

  private mapWebhookEventType(data: FenigeWebhookPayload): WebhookEventType {
    const status = data.transactionStatus || data.clearingStatus;

    switch (status) {
      case 'SUCCESS':
      case 'SUCCESS_WAITING_FOR_CLEARING':
        return 'payment.succeeded';
      case 'FAILURE':
        return 'payment.failed';
      case 'REVERSED':
        return 'payment.refunded';
      case 'REFUNDED':
        return 'payment.refunded';
      default:
        // Clearing-specific
        if (data.clearingStatus === 'APPROVED') return 'payment.succeeded';
        return 'payment.succeeded';
    }
  }
}
