// Hook pour recuperer les prix des carburants proches du client

import { useQuery } from '@tanstack/react-query';
import type { CarburantsResponse } from '@/app/api/carburants/route';

export function useCarburants() {
  return useQuery<CarburantsResponse>({
    queryKey: ['carburants'],
    queryFn: async () => {
      const res = await fetch('/api/carburants');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors de la recuperation');
      }
      return res.json();
    },
    staleTime: 30 * 60 * 1000, // 30min
    retry: false,
  });
}
