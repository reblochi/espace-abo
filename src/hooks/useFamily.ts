// Hook pour la gestion des membres de la famille

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FamilyMember, FamilyMemberInput } from '@/types';

export function useFamily() {
  const queryClient = useQueryClient();

  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ['family'],
    queryFn: async (): Promise<FamilyMember[]> => {
      const response = await fetch('/api/family');
      if (!response.ok) throw new Error('Erreur chargement famille');
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FamilyMemberInput): Promise<FamilyMember> => {
      const response = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erreur creation');
      }
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['family'] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FamilyMemberInput }): Promise<FamilyMember> => {
      const response = await fetch(`/api/family/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erreur mise a jour');
      }
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['family'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/family/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erreur suppression');
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['family'] }),
  });

  return {
    members,
    isLoading,
    error,
    createMember: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateMember: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteMember: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
