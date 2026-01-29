// Types pour les abonnements

export type SubscriptionStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'ENDED';

export type DeadlineStatus =
  | 'UPCOMING'
  | 'PERFORMED'
  | 'CANCELED';

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export interface Subscription {
  id: string;
  reference: string;
  userId: string;
  status: SubscriptionStatus;
  amountCents: number;
  currency: string;
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  canceledAt: string | null;
  endDate: string | null;
  pspProvider: string;
  pspCustomerId: string | null;
  pspSubscriptionId: string | null;
  unsubscribeToken: string;
  changeCardToken: string;
  createdAt: string;
  updatedAt: string;
  deadlines?: SubscriptionDeadline[];
}

export interface SubscriptionDeadline {
  id: string;
  subscriptionId: string;
  deadlineNumber: number;
  amountCents: number;
  dueDate: string;
  status: DeadlineStatus;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  refundedAt: string | null;
  refundedAmount: number | null;
  pspInvoiceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionWithUser extends Subscription {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

// Input types
export interface CreateSubscriptionInput {
  priceId: string;
  paymentMethodId: string;
}

export interface CancelSubscriptionInput {
  reason?: string;
  immediate?: boolean;
}

// Response types
export interface SubscriptionResponse {
  subscription: Subscription;
  clientSecret?: string;
}

export interface SubscriptionCheckResponse {
  isActive: boolean;
  subscription: Subscription | null;
  remainingDays?: number;
}
