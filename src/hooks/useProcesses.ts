// Hook pour la gestion des demarches

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Process, ProcessListResponse, CreateProcessInput } from '@/types';

interface UseProcessesOptions {
  page?: number;
  limit?: number;
  status?: string;
}

export function useProcesses(options: UseProcessesOptions = {}) {
  const { page = 1, limit = 10, status } = options;
  const queryClient = useQueryClient();

  const queryKey = ['processes', { page, limit, status }];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async (): Promise<ProcessListResponse> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (status) params.set('status', status);

      const response = await fetch(`/api/processes?${params}`);
      if (!response.ok) throw new Error('Erreur chargement demarches');
      return response.json();
    },
  });

  // Mutation pour creer une demarche
  const createMutation = useMutation({
    mutationFn: async (input: CreateProcessInput): Promise<{ process: Process }> => {
      const response = await fetch('/api/processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur creation demarche');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
    },
  });

  return {
    processes: data?.processes || [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch,
    createProcess: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
  };
}

// Hook pour les statistiques des demarches
export function useProcessStats() {
  return useQuery({
    queryKey: ['processes', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/processes/stats');
      if (!response.ok) throw new Error('Erreur chargement statistiques');
      return response.json();
    },
  });
}
