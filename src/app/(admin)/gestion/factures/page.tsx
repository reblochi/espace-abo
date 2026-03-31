// Admin - Liste factures

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { SearchBar } from '@/components/admin/SearchBar';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/utils';

const typeLabels: Record<string, string> = {
  SUBSCRIPTION: 'Abonnement',
  PROCESS: 'Demarche',
  CREDIT_NOTE: 'Avoir',
};

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  DRAFT: { label: 'Brouillon', variant: 'secondary' },
  SENT: { label: 'Envoyée', variant: 'warning' },
  PAID: { label: 'Payée', variant: 'success' },
  VOID: { label: 'Annulée', variant: 'destructive' },
};

export default function AdminInvoicesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'invoices', search, typeFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (typeFilter) params.set('type', typeFilter);
      const res = await fetch(`/api/gestion/invoices?${params}`);
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
      key: 'number',
      label: 'Numero',
      render: (item: Record<string, unknown>) => (
        <span className="font-medium">{String(item.number)}</span>
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
      key: 'type',
      label: 'Type',
      render: (item: Record<string, unknown>) => (
        <span className={item.type === 'CREDIT_NOTE' ? 'text-red-600' : ''}>
          {typeLabels[String(item.type)] || String(item.type)}
        </span>
      ),
    },
    {
      key: 'totalCents',
      label: 'Montant',
      render: (item: Record<string, unknown>) => (
        <span className={(item.totalCents as number) < 0 ? 'text-red-600 font-medium' : ''}>
          {formatCurrency(item.totalCents as number)}
        </span>
      ),
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
      key: 'createdAt',
      label: 'Date',
      render: (item: Record<string, unknown>) => formatDate(item.createdAt as string),
    },
    {
      key: 'actions',
      label: '',
      render: (item: Record<string, unknown>) => (
        <a
          href={`/api/gestion/invoices/${item.id}/download`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 hover:text-blue-800 text-xs"
        >
          PDF
        </a>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Factures</h1>

      <div className="flex gap-4 mb-4">
        <div className="flex-1 max-w-md">
          <SearchBar
            placeholder="Rechercher par email, nom, numero..."
            onSearch={handleSearch}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tous les types</option>
          <option value="SUBSCRIPTION">Abonnement</option>
          <option value="PROCESS">Demarche</option>
          <option value="CREDIT_NOTE">Avoir</option>
        </select>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">Chargement...</div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.items || []}
          onRowClick={(item) => router.push(`/gestion/factures/${item.id}`)}
          emptyMessage="Aucune facture trouvee"
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
