// Adaptateur Stripe

import Stripe from 'stripe';
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

export class StripeAdapter extends BasePSPAdapter {
  private stripe: Stripe;

  constructor(config: PSPConfig) {
    super(config);
    this.stripe = new Stripe(config.apiKey, {
      apiVersion: '2023-10-16',
    });
  }

  get provider(): PSPProvider {
    return 'stripe';
  }

  // Clients
  async createCustomer(email: string, metadata?: Record<string, string>): Promise<CreateCustomerResult> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        metadata,
      });

      return {
        customerId: customer.id,
        provider: this.provider,
      };
    } catch (error) {
      this.error('Erreur creation client', error);
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    return this.stripe.customers.retrieve(customerId) as Promise<Stripe.Customer>;
  }

  // Abonnements
  async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
    try {
      let customerId = input.customerId;

      // Creer le client si necessaire
      if (!customerId) {
        const { customerId: newCustomerId } = await this.createCustomer(input.email, input.metadata);
        customerId = newCustomerId;
      }

      // Attacher le payment method au client
      if (input.paymentMethodId) {
        await this.stripe.paymentMethods.attach(input.paymentMethodId, {
          customer: customerId,
        });
        await this.stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: input.paymentMethodId,
          },
        });
      }

      // Creer l'abonnement
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: input.priceId }],
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        metadata: input.metadata,
        expand: ['latest_invoice.payment_intent'],
      });

      // Extraire le client secret pour la confirmation cote client
      const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent;

      return {
        subscriptionId: subscription.id,
        customerId,
        status: this.mapSubscriptionStatus(subscription.status),
        clientSecret: paymentIntent?.client_secret || undefined,
        provider: this.provider,
      };
    } catch (error) {
      this.error('Erreur creation abonnement', error);
    }
  }

  async cancelSubscription(subscriptionId: string, immediately = false): Promise<CancelSubscriptionResult> {
    try {
      let subscription: Stripe.Subscription;

      if (immediately) {
        subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      } else {
        subscription = await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }

      return {
        success: true,
        canceledAt: new Date(subscription.canceled_at! * 1000),
        endDate: subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000)
          : new Date(subscription.current_period_end * 1000),
      };
    } catch (error) {
      this.error('Erreur annulation abonnement', error);
    }
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  // Paiements
  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    try {
      let customerId = input.customerId;

      if (!customerId) {
        const { customerId: newCustomerId } = await this.createCustomer(input.email, input.metadata);
        customerId = newCustomerId;
      }

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: input.amountCents,
        currency: input.currency.toLowerCase(),
        customer: customerId,
        description: input.description,
        payment_method: input.paymentMethodId,
        confirm: !!input.paymentMethodId,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        metadata: input.metadata,
      });

      return {
        paymentId: paymentIntent.id,
        status: this.mapPaymentStatus(paymentIntent.status),
        clientSecret: paymentIntent.client_secret || undefined,
        provider: this.provider,
      };
    } catch (error) {
      this.error('Erreur creation paiement', error);
    }
  }

  async getPayment(paymentId: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(paymentId);
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: input.paymentId,
        amount: input.amountCents,
        reason: input.reason as Stripe.RefundCreateParams.Reason,
      });

      return {
        refundId: refund.id,
        status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
        amountCents: refund.amount,
      };
    } catch (error) {
      this.error('Erreur remboursement', error);
    }
  }

  // Changement CB
  async updatePaymentMethod(customerId: string, returnUrl: string): Promise<UpdatePaymentMethodResult> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
        flow_data: {
          type: 'payment_method_update',
        },
      });

      return {
        success: true,
        redirectUrl: session.url,
      };
    } catch (error) {
      this.error('Erreur changement CB', error);
    }
  }

  // Webhooks
  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    try {
      this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.config.webhookSecret
      );
      return true;
    } catch {
      return false;
    }
  }

  parseWebhookEvent(payload: string | Buffer, signature: string): WebhookEvent {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.config.webhookSecret
    );

    return {
      type: this.mapEventType(event.type),
      provider: this.provider,
      data: this.extractEventData(event),
      rawEvent: event,
    };
  }

  // Mappers internes
  private mapSubscriptionStatus(status: Stripe.Subscription.Status): 'active' | 'pending' | 'incomplete' {
    switch (status) {
      case 'active':
      case 'trialing':
        return 'active';
      case 'incomplete':
      case 'incomplete_expired':
        return 'incomplete';
      default:
        return 'pending';
    }
  }

  private mapPaymentStatus(status: Stripe.PaymentIntent.Status): 'succeeded' | 'pending' | 'requires_action' | 'failed' {
    switch (status) {
      case 'succeeded':
        return 'succeeded';
      case 'requires_action':
      case 'requires_confirmation':
        return 'requires_action';
      case 'canceled':
        return 'failed';
      default:
        return 'pending';
    }
  }

  private mapEventType(type: string): WebhookEventType {
    const mapping: Record<string, WebhookEventType> = {
      'customer.subscription.created': 'subscription.created',
      'customer.subscription.updated': 'subscription.updated',
      'customer.subscription.deleted': 'subscription.deleted',
      'invoice.created': 'invoice.created',
      'invoice.paid': 'invoice.paid',
      'invoice.payment_failed': 'invoice.payment_failed',
      'payment_intent.succeeded': 'payment.succeeded',
      'payment_intent.payment_failed': 'payment.failed',
      'charge.refunded': 'payment.refunded',
      'checkout.session.completed': 'checkout.completed',
      'customer.created': 'customer.created',
      'customer.updated': 'customer.updated',
      'charge.dispute.created': 'charge.dispute.created',
      'charge.dispute.updated': 'charge.dispute.updated',
      'charge.dispute.closed': 'charge.dispute.closed',
    };
    const mapped = mapping[type];
    if (!mapped) {
      console.log(`[Stripe] Event type non mappe, ignore: ${type}`);
    }
    return mapped || (null as unknown as WebhookEventType);
  }

  private extractEventData(event: Stripe.Event): WebhookEvent['data'] {
    const obj = event.data.object as Record<string, unknown>;
    const metadata = obj.metadata as Record<string, string> | undefined;

    // Pour les events dispute, la structure est differente
    if (event.type.startsWith('charge.dispute.')) {
      return {
        disputeId: obj.id as string,
        paymentId: obj.charge as string,
        amountCents: obj.amount as number,
        disputeReason: obj.reason as string,
        disputeStatus: obj.status as string,
        metadata: (obj.metadata as Record<string, string>) || undefined,
      };
    }

    return {
      subscriptionId: obj.subscription as string,
      customerId: obj.customer as string,
      paymentId: obj.payment_intent as string || obj.id as string,
      invoiceId: obj.id as string,
      amountCents: obj.amount as number || obj.amount_paid as number || obj.amount_total as number,
      status: obj.status as string,
      externalReference: metadata?.external_reference,
      checkoutSessionId: event.type === 'checkout.session.completed' ? obj.id as string : undefined,
      checkoutMode: obj.mode as 'payment' | 'subscription' | 'setup' | undefined,
      metadata,
    };
  }
}
