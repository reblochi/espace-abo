// Admin - Liste et recherche clients

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { SearchBar } from '@/components/admin/SearchBar';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const subscriptionStatusLabels: Record<string, { label: string; variant: string }> = {
  ACTIVE: { label: 'Actif', variant: 'success' },
  PENDING: { label: 'En attente', variant: 'warning' },
  PAST_DUE: { label: 'Impaye', variant: 'destructive' },
  CANCELED: { label: 'Annule', variant: 'secondary' },
  ENDED: { label: 'Termine', variant: 'secondary' },
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
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
      label: 'ID',
      render: (item: Record<string, unknown>) => (
        <span className="font-mono text-xs text-gray-500">{String(item.reference || '-')}</span>
      ),
    },
    {
      key: 'name',
      label: 'Nom',
      render: (item: Record<string, unknown>) => (
        <span className="font-medium text-gray-900">
          {String(item.firstName)} {String(item.lastName)}
        </span>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'subscription',
      label: 'Abonnement',
      render: (item: Record<string, unknown>) => {
        const sub = item.subscription as { status: string; reference: string } | null;
        if (!sub) return <span className="text-gray-400">Aucun</span>;
        const config = subscriptionStatusLabels[sub.status] || { label: sub.status, variant: 'secondary' };
        return <Badge variant={config.variant as 'success' | 'warning' | 'destructive' | 'secondary'}>{config.label}</Badge>;
      },
    },
    {
      key: 'city',
      label: 'Ville',
      render: (item: Record<string, unknown>) =>
        item.city ? `${item.zipCode} ${item.city}` : '-',
    },
    {
      key: 'createdAt',
      label: 'Inscription',
      render: (item: Record<string, unknown>) => formatDate(item.createdAt as string),
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Clients</h1>

      <div className="mb-4 max-w-md">
        <SearchBar
          placeholder="Rechercher par email, nom, ID ou ref demarche..."
          onSearch={handleSearch}
        />
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          Chargement...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.items || []}
          onRowClick={(item) => router.push(`/admin/clients/${item.id}`)}
          emptyMessage="Aucun client trouve"
          pagination={
            data?.pagination
              ? {
                  page: data.pagination.page,
                  totalPages: data.pagination.totalPages,
                  total: data.pagination.total,
                  onPageChange: setPage,
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
