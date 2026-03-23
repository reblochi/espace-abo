// Hook pour recuperer les services publics proches du client

import { useQuery } from '@tanstack/react-query';
import type { ServicePublic } from '@/app/api/services-publics/route';

interface ServicesPublicsResponse {
  services: ServicePublic[];
  codePostal: string;
}

export function useServicesPublics() {
  return useQuery<ServicesPublicsResponse>({
    queryKey: ['services-publics'],
    queryFn: async () => {
      const res = await fetch('/api/services-publics');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erreur lors de la recuperation');
      }
      return res.json();
    },
    staleTime: 60 * 60 * 1000, // 1h
    retry: false,
  });
}
