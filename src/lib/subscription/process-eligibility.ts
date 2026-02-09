// Service de verification d'eligibilite des demarches via abonnement

import { prisma } from '@/lib/db';
import type { ProcessType } from '@/types';
import { isProcessIncludedInSubscription } from '@/lib/process-types';

export interface ProcessEligibility {
  eligible: boolean;
  reason?: 'NO_SUBSCRIPTION' | 'SUBSCRIPTION_INACTIVE' | 'PROCESS_NOT_INCLUDED' | 'QUOTA_EXCEEDED';
  remainingQuota?: number;
  subscriptionStatus?: string;
  subscriptionId?: string;
}

/**
 * Verifie si un utilisateur peut utiliser son abonnement pour une demarche
 */
export async function checkProcessEligibility(
  userId: string,
  processType: ProcessType
): Promise<ProcessEligibility> {
  // Recuperer l'abonnement actif ou annule mais avec droits restants
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      OR: [
        { status: 'ACTIVE' },
        {
          status: 'CANCELED',
          endDate: { gte: new Date() },
        },
      ],
    },
  });

  if (!subscription) {
    return {
      eligible: false,
      reason: 'NO_SUBSCRIPTION',
    };
  }

  // Verifier si l'abonnement est actif
  if (subscription.status !== 'ACTIVE' && subscription.status !== 'CANCELED') {
    return {
      eligible: false,
      reason: 'SUBSCRIPTION_INACTIVE',
      subscriptionStatus: subscription.status,
      subscriptionId: subscription.id,
    };
  }

  // Verifier si le type de demarche est inclus
  if (!isProcessIncludedInSubscription(processType)) {
    return {
      eligible: false,
      reason: 'PROCESS_NOT_INCLUDED',
      subscriptionStatus: subscription.status,
      subscriptionId: subscription.id,
    };
  }

  // Verifier le quota mensuel si applicable
  if (subscription.maxProcessPerMonth !== null) {
    const usedThisPeriod = await prisma.subscriptionProcessUsage.count({
      where: {
        subscriptionId: subscription.id,
        periodStart: { lte: new Date() },
        periodEnd: { gte: new Date() },
      },
    });

    if (usedThisPeriod >= subscription.maxProcessPerMonth) {
      return {
        eligible: false,
        reason: 'QUOTA_EXCEEDED',
        remainingQuota: 0,
        subscriptionStatus: subscription.status,
        subscriptionId: subscription.id,
      };
    }

    return {
      eligible: true,
      remainingQuota: subscription.maxProcessPerMonth - usedThisPeriod,
      subscriptionStatus: subscription.status,
      subscriptionId: subscription.id,
    };
  }

  return {
    eligible: true,
    subscriptionStatus: subscription.status,
    subscriptionId: subscription.id,
  };
}

/**
 * Consomme une demarche sur l'abonnement
 */
export async function consumeSubscriptionProcess(
  subscriptionId: string,
  processId: string,
  processType: ProcessType
): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Creer l'entree d'utilisation
  await prisma.subscriptionProcessUsage.create({
    data: {
      subscriptionId,
      processId,
      processType,
      usedAt: new Date(),
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
    },
  });

  // Mettre a jour le compteur
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      includedProcessCount: { increment: 1 },
    },
  });
}

/**
 * Annule la consommation d'une demarche (en cas de remboursement)
 */
export async function releaseSubscriptionProcess(processId: string): Promise<void> {
  const usage = await prisma.subscriptionProcessUsage.findUnique({
    where: { processId },
  });

  if (!usage) return;

  // Supprimer l'utilisation
  await prisma.subscriptionProcessUsage.delete({
    where: { processId },
  });

  // Decrementer le compteur
  await prisma.subscription.update({
    where: { id: usage.subscriptionId },
    data: {
      includedProcessCount: { decrement: 1 },
    },
  });
}

/**
 * Compte les demarches utilisees ce mois pour un abonnement
 */
export async function getSubscriptionUsageCount(subscriptionId: string): Promise<{
  used: number;
  max: number | null;
  remaining: number | null;
}> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    return { used: 0, max: null, remaining: null };
  }

  const used = await prisma.subscriptionProcessUsage.count({
    where: {
      subscriptionId,
      periodStart: { lte: new Date() },
      periodEnd: { gte: new Date() },
    },
  });

  return {
    used,
    max: subscription.maxProcessPerMonth,
    remaining: subscription.maxProcessPerMonth !== null
      ? Math.max(0, subscription.maxProcessPerMonth - used)
      : null,
  };
}

/**
 * Reinitialise les compteurs de tous les abonnements
 * A appeler via un cron job quotidien
 */
export async function resetMonthlyQuotas(): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Trouver les abonnements dont la periode a change
  const subscriptionsToReset = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      processCountResetAt: { lt: startOfMonth },
    },
  });

  let resetCount = 0;

  for (const sub of subscriptionsToReset) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        includedProcessCount: 0,
        processCountResetAt: now,
      },
    });
    resetCount++;
  }

  return resetCount;
}
