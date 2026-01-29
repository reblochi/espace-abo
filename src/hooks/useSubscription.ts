// Hook pour la gestion des abonnements

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Subscription, SubscriptionCheckResponse } from '@/types';

export function useSubscription() {
  const queryClient = useQueryClient();

  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ['subscription'],
    queryFn: async (): Promise<Subscription | null> => {
      const response = await fetch('/api/subscriptions/me');
      if (response.status === 204) return null;
      if (!response.ok) throw new Error('Erreur recuperation abonnement');
      return response.json();
    },
  });

  // Verifier si l'abonnement est actif (inclut les abonnements annules avec droits restants)
  const isActive = subscription && (
    subscription.status === 'ACTIVE' ||
    (subscription.status === 'CANCELED' &&
     subscription.endDate &&
     new Date(subscription.endDate) > new Date())
  );

  // Jours restants pour les abonnements annules
  const remainingDays = subscription?.endDate
    ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  // Mutation pour annuler l'abonnement
  const cancelMutation = useMutation({
    mutationFn: async (reason?: string) => {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur annulation');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
  });

  // Mutation pour changer de carte bancaire
  const changeCardMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/subscriptions/change-card', {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur changement CB');
      }
      return response.json();
    },
  });

  return {
    subscription,
    isActive,
    remainingDays,
    isLoading,
    error,
    cancel: cancelMutation.mutate,
    isCanceling: cancelMutation.isPending,
    cancelError: cancelMutation.error,
    changeCard: changeCardMutation.mutateAsync,
    isChangingCard: changeCardMutation.isPending,
  };
}

// Hook pour verifier rapidement le statut abonnement
export function useSubscriptionCheck() {
  return useQuery({
    queryKey: ['subscription', 'check'],
    queryFn: async (): Promise<SubscriptionCheckResponse> => {
      const response = await fetch('/api/subscriptions/check');
      if (!response.ok) throw new Error('Erreur verification abonnement');
      return response.json();
    },
    staleTime: 30000, // 30 secondes
  });
}
