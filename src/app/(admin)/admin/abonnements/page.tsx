// Admin - Liste abonnements

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { SearchBar } from '@/components/admin/SearchBar';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/utils';

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  ACTIVE: { label: 'Actif', variant: 'success' },
  PENDING: { label: 'En attente', variant: 'warning' },
  PAST_DUE: { label: 'Impayé', variant: 'destructive' },
  CANCELED: { label: "Annulé", variant: 'secondary' },
  ENDED: { label: 'Terminé', variant: 'secondary' },
};

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'subscriptions', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/subscriptions?${params}`);
      if (!res.ok) throw new Error('Erreur chargement');
      return res.json();
    },
  });

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  const columns = [
    {
      key: 'reference',
      label: 'Reference',
      render: (item: Record<string, unknown>) => (
        <span className="font-medium">{String(item.reference)}</span>
      ),
    },
    {
      key: 'user',
      label: 'Utilisateur',
      render: (item: Record<string, unknown>) => {
        const u = item.user as { firstName: string; lastName: string; email: string } | null;
        return u ? (
          <div>
            <div className="text-sm">{u.firstName} {u.lastName}</div>
            <div className="text-xs text-gray-400">{u.email}</div>
          </div>
        ) : '-';
      },
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
      key: 'amountCents',
      label: 'Montant',
      render: (item: Record<string, unknown>) => formatCurrency(item.amountCents as number) + '/mois',
    },
    {
      key: 'card',
      label: 'Carte',
      render: (item: Record<string, unknown>) => {
        if (!item.cardLast4) return <span className="text-gray-400">-</span>;
        const expiring = item.cardExpiringSoon as boolean;
        return (
          <div className="flex items-center gap-1">
            <span className="text-sm">•••• {String(item.cardLast4)}</span>
            <span className="text-xs text-gray-400">{String(item.cardExpMonth)}/{String(item.cardExpYear)}</span>
            {expiring && (
              <Badge variant="warning">Expire</Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'startDate',
      label: 'Debut',
      render: (item: Record<string, unknown>) => formatDate(item.startDate as string),
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Abonnements</h1>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 max-w-md">
          <SearchBar placeholder="Rechercher par email, nom..." onSearch={handleSearch} />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Actif</option>
          <option value="PAST_DUE">Impaye</option>
          <option value="CANCELED">Annule</option>
          <option value="ENDED">Termine</option>
        </select>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">Chargement...</div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.items || []}
          onRowClick={(item) => router.push(`/admin/abonnements/${item.id}`)}
          emptyMessage="Aucun abonnement"
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
