// Hook pour la gestion du profil utilisateur

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Profile, UpdateProfileInput, ChangePasswordInput } from '@/types';

export function useProfile() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<Profile> => {
      const response = await fetch('/api/profile');
      if (!response.ok) throw new Error('Erreur chargement profil');
      return response.json();
    },
  });

  // Mutation pour mettre a jour le profil
  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProfileInput): Promise<Profile> => {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur mise a jour');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateMutation.mutate,
    updateProfileAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}

// Hook pour changer le mot de passe
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordInput): Promise<{ success: boolean; message: string }> => {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur changement mot de passe');
      }
      return response.json();
    },
  });
}
