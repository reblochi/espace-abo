// Adaptateur Fenige PayTool (hosted payment page)
// Doc: https://paytool-api-dev.fenige.pl/paymenthub-documentation.html

import crypto from 'crypto';
import { BasePSPAdapter } from './base-adapter';
import { prisma } from '@/lib/db';
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
  CreateCheckoutSessionInput,
  CreateCheckoutSessionResult,
  CheckoutSessionDetails,
  CheckoutLineItem,
  InvoiceAuthDetails,
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

  // --- Checkout sessions ---
  // PayTool n'a pas de "checkout session" native. On construit l'equivalent par-dessus
  // pre-init + paymelink, et on persiste les metadata dans la table psp_sessions
  // pour les retrouver au retour (verify).

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResult> {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || '';

      const amountCents = input.lineItems.reduce((sum, item) => sum + this.lineItemAmountCents(item), 0);
      if (amountCents <= 0) {
        throw new Error('Fenige: montant total nul, impossible de creer la session');
      }

      const currency = this.inferCurrency(input.lineItems);
      const description = this.buildDescription(input.lineItems);
      const orderNumber = (input.metadata?.processReference || input.metadata?.reference || `ORD-${Date.now()}`).slice(0, 32);
      const transactionRef = `ref_${Date.now()}`.slice(0, 20);

      // PayTool ne retourne pas {CHECKOUT_SESSION_ID} comme Stripe — on cree d'abord
      // le pre-init pour avoir le transactionId, puis on injecte dans successUrl.
      const typeOfAuthorization = input.mode === 'subscription' ? 'COF' : 'PURCHASE';

      const preInit = await this.requestWithApiKey<PayToolPreInitResponse>(
        'POST',
        '/transactions/pre-initialization',
        {
          currencyCode: currency.toUpperCase(),
          amount: amountCents,
          receiverAmount: amountCents,
          transactionRef,
          description,
          orderNumber,
          formLanguage: (input.locale || 'fr').slice(0, 2),
          redirectUrl: this.buildRedirectUrls(input, null),
          sender: {
            firstName: input.metadata?.firstName || '',
            lastName: input.metadata?.lastName || '',
            email: input.customerEmail || '',
            address: input.metadata?.address ? JSON.parse(input.metadata.address) : undefined,
          },
          autoClear: true,
          typeOfAuthorization,
          countryOfResidence: input.metadata?.countryCode || 'FR',
          allowedPaymentMethods: ['CARD'],
          merchantUuid: this.merchantUuid,
        }
      );

      // Regenerer les URLs avec le vrai transactionId en remplacement du placeholder
      const finalRedirect = this.buildRedirectUrls(input, preInit.transactionId);

      const paymelink = await this.requestWithApiKey<PayToolPaymelinkResponse>(
        'POST',
        '/external-api/paymelink',
        {
          preInitData: {
            transactionId: preInit.transactionId,
            currencyCode: currency.toUpperCase(),
            amount: amountCents,
            receiverAmount: amountCents,
            description,
            orderNumber,
            redirectUrl: finalRedirect,
            formLanguage: (input.locale || 'fr').slice(0, 2),
            sender: {
              firstName: input.metadata?.firstName || '',
              lastName: input.metadata?.lastName || '',
              email: input.customerEmail || '',
            },
            autoClear: true,
            merchantUuid: this.merchantUuid,
            countryOfResidence: input.metadata?.countryCode || 'FR',
            allowedPaymentMethods: ['CARD'],
          },
        }
      );

      // Persister la session localement — source de verite pour les metadata au retour
      await prisma.pspSession.create({
        data: {
          pspProvider: 'fenige',
          sessionId: preInit.transactionId,
          mode: input.mode,
          amountCents,
          currency,
          customerEmail: input.customerEmail,
          customerId: input.customerId,
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
          metadata: input.metadata || {},
          subscriptionMetadata: input.subscriptionMetadata || {},
          paymentIntentMetadata: input.paymentIntentMetadata || {},
        },
      });

      return {
        sessionId: preInit.transactionId,
        url: paymelink.value,
        provider: this.provider,
      };
    } catch (error) {
      this.error('Erreur creation checkout session Fenige', error);
    }
  }

  async retrieveCheckoutSession(sessionId: string, expandSubscription = false): Promise<CheckoutSessionDetails> {
    try {
      const localSession = await prisma.pspSession.findUnique({
        where: { sessionId },
      });

      if (!localSession) {
        throw new Error(`Fenige: session ${sessionId} introuvable en local`);
      }

      const details = await this.getPayment(sessionId);
      const paid = details.transactionStatus === 'SUCCESS' || details.transactionStatus === 'SUCCESS_WAITING_FOR_CLEARING';
      const paymentStatus: CheckoutSessionDetails['paymentStatus'] = paid ? 'paid' : 'unpaid';

      // Synchroniser l'etat local (idempotent)
      if (
        localSession.paymentStatus !== paymentStatus ||
        localSession.cofInitialUuid !== (details.cofInitialUuid || null) ||
        localSession.paymentIntentId !== sessionId
      ) {
        await prisma.pspSession.update({
          where: { sessionId },
          data: {
            paymentStatus,
            paymentIntentId: sessionId,
            cofInitialUuid: details.cofInitialUuid || null,
            subscriptionId: details.cofInitialUuid || null,
          },
        });
      }

      const result: CheckoutSessionDetails = {
        sessionId,
        paymentStatus,
        mode: localSession.mode as CheckoutSessionDetails['mode'],
        metadata: (localSession.metadata as Record<string, string>) || {},
        customerId: localSession.customerId || undefined,
        subscriptionId: details.cofInitialUuid || undefined,
        paymentIntentId: sessionId,
        provider: this.provider,
      };

      if (expandSubscription && localSession.mode === 'subscription' && details.cofInitialUuid) {
        const periodStart = new Date();
        const periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        result.subscription = {
          id: details.cofInitialUuid,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          latestInvoiceId: sessionId, // on reutilise le transactionId comme invoiceId
        };
      }

      return result;
    } catch (error) {
      this.error('Erreur recuperation checkout session Fenige', error);
    }
  }

  async getInvoiceAuthDetails(invoiceId: string): Promise<InvoiceAuthDetails> {
    try {
      // Chez Fenige, l'invoiceId est le transactionId lui-meme
      const details = await this.getPayment(invoiceId);
      return {
        invoiceId,
        paymentIntentId: details.transactionId,
        // PayTool n'expose pas de champ 3DS standardise. On remonte responseCode
        // prefixe pour tracabilite RGPD / consentement fort.
        threeDsResult: details.responseCode ? `fenige_${details.responseCode}` : undefined,
      };
    } catch (error) {
      // Ne pas bloquer la finalisation si la recup des details echoue
      console.error('[PSP:fenige] getInvoiceAuthDetails error', error);
      return { invoiceId };
    }
  }

  // --- Helpers checkout ---

  private lineItemAmountCents(item: CheckoutLineItem): number {
    if (item.priceData) {
      return item.priceData.unitAmountCents * item.quantity;
    }
    // priceId non supporte par Fenige (pas de catalogue cote PSP).
    // Les callers doivent fournir priceData pour Fenige, ou passer par un mapping
    // env var FENIGE_PRICE_* si necessaire plus tard.
    throw new Error('Fenige: lineItem sans priceData non supporte (pas de catalogue PSP)');
  }

  private inferCurrency(lineItems: CheckoutLineItem[]): string {
    const withCurrency = lineItems.find((i) => i.priceData?.currency);
    return withCurrency?.priceData?.currency || 'eur';
  }

  private buildDescription(lineItems: CheckoutLineItem[]): string {
    const names = lineItems
      .map((i) => i.priceData?.productName)
      .filter(Boolean);
    const desc = names.join(' + ') || 'Paiement SAF SERVICE';
    return desc.slice(0, 120); // limite PayTool courante
  }

  private buildRedirectUrls(input: CreateCheckoutSessionInput, transactionId: string | null) {
    const substitute = (url: string) =>
      transactionId
        ? url.replace('{CHECKOUT_SESSION_ID}', transactionId)
        : url.replace('{CHECKOUT_SESSION_ID}', 'PENDING');

    return {
      successUrl: substitute(input.successUrl),
      failureUrl: substitute(input.cancelUrl),
      cancelUrl: substitute(input.cancelUrl),
    };
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
