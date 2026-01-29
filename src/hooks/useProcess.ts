// Hook pour le detail d'une demarche

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProcessDetail, FileType } from '@/types';

export function useProcess(reference: string) {
  return useQuery({
    queryKey: ['process', reference],
    queryFn: async (): Promise<ProcessDetail> => {
      const response = await fetch(`/api/processes/${reference}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur chargement demarche');
      }
      return response.json();
    },
    enabled: !!reference,
  });
}

// Hook pour upload de fichiers sur une demarche
export function useUploadProcessFile(reference: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, fileType }: { file: File; fileType: FileType }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      const response = await fetch(`/api/processes/${reference}/files`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur upload fichier');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalider le cache du process et des documents
      queryClient.invalidateQueries({ queryKey: ['process', reference] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// Hook pour les fichiers d'une demarche
export function useProcessFiles(reference: string) {
  return useQuery({
    queryKey: ['process', reference, 'files'],
    queryFn: async () => {
      const response = await fetch(`/api/processes/${reference}/files`);
      if (!response.ok) throw new Error('Erreur chargement fichiers');
      return response.json();
    },
    enabled: !!reference,
  });
}
