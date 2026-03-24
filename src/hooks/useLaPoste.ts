// Hook pour recuperer les bureaux de poste et boites aux lettres

import { useQuery } from '@tanstack/react-query';
import type { LaPosteResponse } from '@/app/api/la-poste/route';

export function useLaPoste() {
  return useQuery<LaPosteResponse>({
    queryKey: ['la-poste'],
    queryFn: async () => {
      const res = await fetch('/api/la-poste');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors de la recuperation');
      }
      return res.json();
    },
    staleTime: 24 * 60 * 60 * 1000, // 24h (donnees statiques)
    retry: false,
  });
}
