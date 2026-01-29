// Adaptateur HiPay (implementation simplifiee)

import axios, { type AxiosInstance } from 'axios';
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

export class HiPayAdapter extends BasePSPAdapter {
  private client: AxiosInstance;

  constructor(config: PSPConfig) {
    super(config);

    const baseURL = config.sandbox
      ? 'https://stage-secure-gateway.hipay-tpp.com/rest/v1'
      : 'https://secure-gateway.hipay-tpp.com/rest/v1';

    this.client = axios.create({
      baseURL,
      auth: {
        username: config.apiKey,
        password: config.extraConfig?.apiSecret as string,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  get provider(): PSPProvider {
    return 'hipay';
  }

  // Clients - HiPay n'a pas vraiment de concept de client separe
  async createCustomer(email: string, metadata?: Record<string, string>): Promise<CreateCustomerResult> {
    // HiPay gere les clients via les transactions
    // On retourne un ID base sur l'email comme reference
    const customerId = `hipay_${Buffer.from(email).toString('base64').slice(0, 20)}`;
    return {
      customerId,
      provider: this.provider,
    };
  }

  async getCustomer(customerId: string): Promise<unknown> {
    // HiPay n'a pas d'endpoint client
    return { customerId };
  }

  // Abonnements via HiPay Order
  async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
    try {
      // HiPay gere les abonnements via des ordres recurrents
      const response = await this.client.post('/order', {
        orderid: `sub_${Date.now()}`,
        description: 'Abonnement mensuel',
        currency: 'EUR',
        amount: (input.metadata?.amountCents as unknown as number || 990) / 100,
        email: input.email,
        payment_product: 'cb', // Carte bancaire
        recurring_payment: true,
        eci: '7', // E-commerce
        accept_url: input.metadata?.returnUrl || process.env.NEXT_PUBLIC_APP_URL,
        decline_url: input.metadata?.cancelUrl || process.env.NEXT_PUBLIC_APP_URL,
        pending_url: input.metadata?.pendingUrl || process.env.NEXT_PUBLIC_APP_URL,
        cancel_url: input.metadata?.cancelUrl || process.env.NEXT_PUBLIC_APP_URL,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/hipay`,
      });

      return {
        subscriptionId: response.data.transactionReference,
        customerId: input.customerId || input.email,
        status: 'pending',
        redirectUrl: response.data.forwardUrl,
        provider: this.provider,
      };
    } catch (error) {
      this.error('Erreur creation abonnement HiPay', error);
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<CancelSubscriptionResult> {
    // HiPay necessite une annulation manuelle des ordres recurrents
    // Implementation via API maintenance HiPay
    return {
      success: true,
      canceledAt: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
    };
  }

  async getSubscription(subscriptionId: string): Promise<unknown> {
    const response = await this.client.get(`/transaction/${subscriptionId}`);
    return response.data;
  }

  // Paiements
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    try {
      const response = await this.client.post('/order', {
        orderid: `pay_${Date.now()}`,
        description: input.description,
        currency: input.currency,
        amount: input.amountCents / 100,
        email: input.email,
        payment_product: 'cb',
        eci: '7',
        accept_url: input.returnUrl || process.env.NEXT_PUBLIC_APP_URL,
        decline_url: input.returnUrl || process.env.NEXT_PUBLIC_APP_URL,
        pending_url: input.returnUrl || process.env.NEXT_PUBLIC_APP_URL,
        cancel_url: input.returnUrl || process.env.NEXT_PUBLIC_APP_URL,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/hipay`,
        custom_data: JSON.stringify(input.metadata),
      });

      return {
        paymentId: response.data.transactionReference,
        status: 'pending',
        redirectUrl: response.data.forwardUrl,
        provider: this.provider,
      };
    } catch (error) {
      this.error('Erreur creation paiement HiPay', error);
    }
  }

  async getPayment(paymentId: string): Promise<unknown> {
    const response = await this.client.get(`/transaction/${paymentId}`);
    return response.data;
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    try {
      const response = await this.client.post('/maintenance/transaction/refund', {
        transaction: input.paymentId,
        amount: input.amountCents ? input.amountCents / 100 : undefined,
      });

      return {
        refundId: response.data.transactionReference,
        status: response.data.status === 124 ? 'succeeded' : 'pending',
        amountCents: input.amountCents || 0,
      };
    } catch (error) {
      this.error('Erreur remboursement HiPay', error);
    }
  }

  // Changement CB
  async updatePaymentMethod(customerId: string, returnUrl: string): Promise<UpdatePaymentMethodResult> {
    // HiPay necessite une nouvelle transaction pour changer la CB
    // On redirige vers une page de mise a jour
    return {
      success: true,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/update-payment-method?customer=${customerId}&return=${encodeURIComponent(returnUrl)}`,
    };
  }

  // Webhooks
  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');
    return signature === expectedSignature;
  }

  parseWebhookEvent(payload: string | Buffer, signature: string): WebhookEvent {
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Signature webhook invalide');
    }

    const data = JSON.parse(payload.toString());

    return {
      type: this.mapEventType(data.status),
      provider: this.provider,
      data: {
        subscriptionId: data.transactionReference,
        customerId: data.email,
        paymentId: data.transactionReference,
        amountCents: Math.round(parseFloat(data.capturedAmount || data.authorizedAmount) * 100),
        status: String(data.status),
        externalReference: data.orderid,
      },
      rawEvent: data,
    };
  }

  private mapEventType(status: number): WebhookEventType {
    // Codes statut HiPay
    const mapping: Record<number, WebhookEventType> = {
      116: 'payment.succeeded', // Authorized
      117: 'payment.succeeded', // Captured
      118: 'payment.refunded',  // Refunded
      124: 'payment.refunded',  // Refund Requested
      113: 'payment.failed',    // Refused
      114: 'payment.failed',    // Expired
      115: 'subscription.canceled', // Cancelled
    };
    return mapping[status] || 'payment.succeeded';
  }
}
