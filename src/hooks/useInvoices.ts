// Hook pour la gestion des factures

'use client';

import { useQuery } from '@tanstack/react-query';
import type { InvoiceListResponse } from '@/types';

interface UseInvoicesOptions {
  page?: number;
  limit?: number;
}

export function useInvoices(options: UseInvoicesOptions = {}) {
  const { page = 1, limit = 10 } = options;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['invoices', { page, limit }],
    queryFn: async (): Promise<InvoiceListResponse> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      const response = await fetch(`/api/invoices?${params}`);
      if (!response.ok) throw new Error('Erreur chargement factures');
      return response.json();
    },
  });

  return {
    invoices: data?.invoices || [],
    pagination: data?.pagination,
    isLoading,
    error,
    refetch,
  };
}

// Hook pour telecharger une facture PDF
export function useDownloadInvoice() {
  const download = async (id: string, number: string) => {
    const response = await fetch(`/api/invoices/${id}/download`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur telechargement');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-${number}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return { download };
}
