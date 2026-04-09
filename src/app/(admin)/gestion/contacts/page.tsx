// Admin - Liste des soumissions contact

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'info' }> = {
  NEW: { label: 'Nouveau', variant: 'info' },
  IN_PROGRESS: { label: 'En cours', variant: 'warning' },
  WAITING_CUSTOMER: { label: 'Attente client', variant: 'secondary' },
  RESOLVED: { label: 'Résolu', variant: 'success' },
  CLOSED: { label: 'Fermé', variant: 'secondary' },
};

const subjectLabels: Record<string, string> = {
  DEMARCHE: 'Démarche',
  ABONNEMENT: 'Abonnement',
  TECHNIQUE: 'Technique',
  SIGNALEMENT: 'Signalement',
  RETRACTATION: 'Rétractation',
  DONNEES: 'Données',
  AUTRE: 'Autre',
};

export default function AdminContactsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'contacts', statusFilter, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await fetch(`/api/gestion/contacts?${params}`);
      if (!res.ok) throw new Error('Erreur chargement');
      return res.json();
    },
  });

  const columns = [
    {
      key: 'reference',
      label: 'Réf.',
      render: (item: Record<string, unknown>) => (
        <span className="font-mono text-xs">{String(item.reference)}</span>
      ),
    },
    {
      key: 'name',
      label: 'Nom',
      render: (item: Record<string, unknown>) => `${item.firstName} ${item.lastName}`,
    },
    {
      key: 'email',
      label: 'Email',
      render: (item: Record<string, unknown>) => (
        <span className="text-xs">{String(item.email)}</span>
      ),
    },
    {
      key: 'subject',
      label: 'Sujet',
      render: (item: Record<string, unknown>) => subjectLabels[String(item.subject)] || String(item.subject),
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
      key: 'replies',
      label: 'Rép.',
      render: (item: Record<string, unknown>) => {
        const count = (item._count as Record<string, number>)?.replies || 0;
        return count > 0 ? <span className="text-xs text-blue-600">{count}</span> : '-';
      },
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (item: Record<string, unknown>) => formatDate(item.createdAt as string),
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-4">Contacts / Demandes</h1>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Rechercher (réf, email, nom)..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="NEW">Nouveau</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="WAITING_CUSTOMER">Attente client</option>
          <option value="RESOLVED">Résolu</option>
          <option value="CLOSED">Fermé</option>
        </select>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">Chargement...</div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.contacts || []}
          onRowClick={(item) => router.push(`/gestion/contacts/${item.id}`)}
          emptyMessage="Aucune demande de contact"
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
