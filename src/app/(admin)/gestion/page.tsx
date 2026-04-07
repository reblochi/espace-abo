// Admin - Dashboard

'use client';

import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@/components/admin/StatCard';
import { AnalyticsSection } from '@/components/admin/AnalyticsSection';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await fetch('/api/gestion/stats');
      if (!res.ok) throw new Error('Erreur chargement');
      return res.json();
    },
    refetchInterval: 60000, // Rafraichir toutes les minutes
  });

  if (isLoading) {
    return <div className="text-gray-500">Chargement...</div>;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Clients"
          value={stats?.totalUsers ?? 0}
        />
        <StatCard
          label="Abonnements actifs"
          value={stats?.activeSubscriptions ?? 0}
          variant="success"
        />
        <StatCard
          label="Revenu ce mois"
          value={formatCurrency(stats?.monthlyRevenueCents ?? 0)}
          variant="success"
        />
        <StatCard
          label="Revenu total"
          value={formatCurrency(stats?.totalRevenueCents ?? 0)}
        />
        <StatCard
          label="Litiges ouverts"
          value={stats?.openDisputes ?? 0}
          variant={stats?.openDisputes > 0 ? 'destructive' : 'default'}
        />
        <StatCard
          label="Total litiges"
          value={stats?.totalDisputes ?? 0}
        />
        <StatCard
          label="Cartes expirant"
          value={stats?.expiringCards ?? 0}
          variant={stats?.expiringCards > 0 ? 'warning' : 'default'}
          sublabel="Dans les 2 prochains mois"
        />
        <StatCard
          label="Demarches totales"
          value={stats?.totalProcesses ?? 0}
        />
      </div>

      {/* Analytics formulaires */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytique formulaires</h2>
        <AnalyticsSection />
      </div>
    </div>
  );
}
