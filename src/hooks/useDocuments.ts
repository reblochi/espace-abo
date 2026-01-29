// Hook pour la gestion des documents

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Document, DocumentListResponse } from '@/types';

interface UseDocumentsOptions {
  page?: number;
  limit?: number;
}

export function useDocuments(options: UseDocumentsOptions = {}) {
  const { page = 1, limit = 10 } = options;
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', { page, limit }],
    queryFn: async (): Promise<DocumentListResponse> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      const response = await fetch(`/api/documents?${params}`);
      if (!response.ok) throw new Error('Erreur chargement documents');
      return response.json();
    },
  });

  // Mutation pour supprimer un document (soft delete)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur suppression');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  return {
    documents: data?.documents || [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch,
    deleteDocument: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}

// Hook pour telecharger un document
export function useDownloadDocument() {
  const download = async (id: string, fileName: string) => {
    const response = await fetch(`/api/documents/${id}/download`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur telechargement');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return { download };
}
