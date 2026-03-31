// Admin - Liste litiges

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/utils';

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  NEEDS_RESPONSE: { label: 'A traiter', variant: 'destructive' },
  UNDER_REVIEW: { label: 'En cours', variant: 'warning' },
  WON: { label: 'Gagne', variant: 'success' },
  LOST: { label: 'Perdu', variant: 'secondary' },
};

export default function AdminDisputesPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'disputes', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/gestion/disputes?${params}`);
      if (!res.ok) throw new Error('Erreur chargement');
      return res.json();
    },
  });

  const columns = [
    {
      key: 'disputedAt',
      label: 'Date',
      render: (item: Record<string, unknown>) => formatDate(item.disputedAt as string),
    },
    {
      key: 'pspDisputeId',
      label: 'ID Litige',
      render: (item: Record<string, unknown>) => (
        <span className="font-mono text-xs">{String(item.pspDisputeId)}</span>
      ),
    },
    {
      key: 'amountCents',
      label: 'Montant',
      render: (item: Record<string, unknown>) => (
        <span className="text-red-600 font-medium">{formatCurrency(item.amountCents as number)}</span>
      ),
    },
    {
      key: 'reason',
      label: 'Raison',
      render: (item: Record<string, unknown>) => String(item.reason || 'Non specifie'),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (item: Record<string, unknown>) => {
        const conf = statusConfig[String(item.status)] || { label: String(item.status), variant: 'secondary' as const };
        return <Badge variant={conf.variant}>{conf.label}</Badge>;
      },
    },
    {
      key: 'creditNote',
      label: 'Avoir',
      render: (item: Record<string, unknown>) => {
        const cn = item.creditNote as { id: string; number: string } | null;
        return cn ? (
          <span className="text-xs text-blue-600">{cn.number}</span>
        ) : '-';
      },
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Litiges / Chargebacks</h1>

      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="NEEDS_RESPONSE">A traiter</option>
          <option value="UNDER_REVIEW">En cours</option>
          <option value="WON">Gagne</option>
          <option value="LOST">Perdu</option>
        </select>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">Chargement...</div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.items || []}
          onRowClick={(item) => router.push(`/gestion/litiges/${item.id}`)}
          emptyMessage="Aucun litige"
          pagination={
            data?.pagination
              ? { page: data.pagination.page, totalPages: data.pagination.totalPages, total: data.pagination.total, onPageChange: setPage }
              : undefined
          }
        />
      )}
    </div>
  );
}
