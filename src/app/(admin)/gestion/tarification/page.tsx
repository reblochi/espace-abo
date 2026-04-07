// Admin - Liste des profils de tarification

'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/admin/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const paymentModeConfig: Record<string, { label: string; variant: 'default' | 'success' | 'secondary' }> = {
  both: { label: 'Les deux', variant: 'default' },
  subscription: { label: 'Abo seul', variant: 'success' },
  one_time: { label: 'Acte seul', variant: 'secondary' },
};

export default function AdminPricingProfilesPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'pricing-profiles'],
    queryFn: async () => {
      const res = await fetch('/api/gestion/pricing-profiles');
      if (!res.ok) throw new Error('Erreur chargement');
      return res.json();
    },
  });

  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (item: Record<string, unknown>) => (
        <span className="font-medium font-mono">{String(item.code)}</span>
      ),
    },
    {
      key: 'label',
      label: 'Libelle',
    },
    {
      key: 'paymentMode',
      label: 'Mode',
      render: (item: Record<string, unknown>) => {
        const mode = String(item.paymentMode);
        const conf = paymentModeConfig[mode] || { label: mode, variant: 'secondary' as const };
        return <Badge variant={conf.variant}>{conf.label}</Badge>;
      },
    },
    {
      key: 'subscriptionMonthlyPrice',
      label: 'Prix abo',
      render: (item: Record<string, unknown>) => (
        <span>{formatCurrency(item.subscriptionMonthlyPrice as number)}/mois</span>
      ),
    },
    {
      key: 'basePrice',
      label: 'Prix prestation',
      render: (item: Record<string, unknown>) => {
        const price = item.basePrice;
        if (price === null || price === undefined) {
          return <span className="text-gray-400 italic">Defaut</span>;
        }
        return <span>{formatCurrency(price as number)}</span>;
      },
    },
    {
      key: 'isActive',
      label: 'Actif',
      render: (item: Record<string, unknown>) => (
        item.isActive
          ? <span className="inline-block w-3 h-3 rounded-full bg-green-500" title="Actif" />
          : <span className="inline-block w-3 h-3 rounded-full bg-red-400" title="Inactif" />
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Tarification</h1>
        <Link href="/gestion/tarification/nouveau">
          <Button>Nouveau profil</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">Chargement...</div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.items || []}
          onRowClick={(item) => router.push(`/gestion/tarification/${item.id}`)}
          emptyMessage="Aucun profil de tarification"
        />
      )}
    </div>
  );
}
