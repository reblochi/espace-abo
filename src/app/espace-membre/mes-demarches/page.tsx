// Page Liste des demarches

'use client';

import { useState } from 'react';
import { ProcessList, QuotaGauge } from '@/components/processes';
import { Button, Card, CardContent } from '@/components/ui';
import { useProcessStats } from '@/hooks/useProcesses';
import { useSubscription } from '@/hooks';
import Link from 'next/link';

const statusFilters = [
  { value: '', label: 'Toutes' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'PENDING_PAYMENT', label: 'A payer' },
  { value: 'AWAITING_INFO', label: 'Info requise' },
  { value: 'COMPLETED', label: 'Terminées' },
];

export default function MesDemarchesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data: stats } = useProcessStats();
  const { isActive } = useSubscription();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes démarches</h1>
          <p className="text-gray-500 mt-1">
            Suivez l'avancement de vos procedures administratives
          </p>
        </div>
        <Link href="/nouvelle-demarche">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouvelle démarche
          </Button>
        </Link>
      </div>

      {/* Jauge quota mensuel */}
      {isActive && (
        <Card>
          <CardContent className="py-4">
            <QuotaGauge used={stats?.total || 0} max={10} />
          </CardContent>
        </Card>
      )}

      {/* Statistiques rapides */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total || 0}</p>
              <p className="text-sm text-gray-500">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{stats.inProgress || 0}</p>
              <p className="text-sm text-gray-500">En cours</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{stats.awaitingInfo || 0}</p>
              <p className="text-sm text-gray-500">Info requise</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.completed || 0}</p>
              <p className="text-sm text-gray-500">Terminées</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-4 py-2 text-sm rounded-full border transition-colors ${
              statusFilter === filter.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Liste des demarches */}
      <ProcessList status={statusFilter || undefined} />
    </div>
  );
}
