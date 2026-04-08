// Page Dashboard Espace Membre

'use client';

import { useAuth, useSubscription, useProcesses } from '@/hooks';
import { DashboardStats, SubscriptionCard, NewsTips, ServicesPublics, CarburantsPrix, LaPoste } from '@/components/dashboard';
import { ProcessStatusBadge, QuotaGauge } from '@/components/processes';
import { Card, CardHeader, CardTitle, CardContent, Button, SkeletonDashboard, ComingSoonBadge } from '@/components/ui';
import { showComingSoonToast } from '@/components/ui/coming-soon';
import { getProcessTypeConfig } from '@/lib/process-types';
import type { ProcessType } from '@/types';
import Link from 'next/link';

const advantages = [
  { label: 'Demarches illimitees', icon: '📋' },
  { label: 'Suivi en temps reel', icon: '📡' },
  { label: 'Assistance prioritaire', icon: '🎯' },
  { label: 'Coffre-fort numerique', icon: '🔒' },
  { label: 'Courriers types', icon: '✉️' },
  { label: 'Rappels d\'expiration', icon: '🔔' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { subscription, isActive, isLoading: subLoading } = useSubscription();
  const { processes, isLoading: processLoading } = useProcesses({ limit: 3 });

  const isLoading = subLoading || processLoading;

  const stats = [
    {
      label: 'Démarches en cours',
      value: processes?.filter(p => p.status !== 'COMPLETED' && p.status !== 'CANCELED').length || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: 'Démarches terminées',
      value: processes?.filter(p => p.status === 'COMPLETED').length || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Statut abonnement',
      value: isActive ? 'Actif' : 'Inactif',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
  ];

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour {user?.name || 'Utilisateur'}
        </h1>
        <p className="text-gray-500 mt-1">
          Bienvenue dans votre espace membre
        </p>
      </div>

      {/* Quota Gauge */}
      {isActive && (
        <Card>
          <CardContent className="py-4">
            <QuotaGauge used={processes?.length || 0} max={10} />
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <DashboardStats stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Abonnement */}
        <SubscriptionCard />

        {/* Démarches récentes */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Démarches récentes</CardTitle>
              <Link href="/espace-membre/mes-demarches">
                <Button variant="ghost" size="sm">
                  Voir tout
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {processes && processes.length > 0 ? (
              <div className="space-y-3">
                {processes.slice(0, 3).map((process) => {
                  const config = getProcessTypeConfig(process.type as ProcessType);
                  return (
                    <div
                      key={process.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="font-medium text-gray-900 truncate">
                          {config?.label || process.type}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 font-mono">{process.reference}</span>
                          <ProcessStatusBadge status={process.status} isFree={process.amountCents === 0} />
                        </div>
                      </div>
                      <Link href={`/espace-membre/mes-demarches/${process.reference}`}>
                        <Button variant="outline" size="sm">
                          Voir
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 mb-4">Aucune démarche en cours</p>
                <Link href="/nouvelle-demarche">
                  <Button>Commencer une démarche</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vos avantages */}
      <Card>
        <CardHeader>
          <CardTitle>Vos avantages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {advantages.map((adv) => (
              <div
                key={adv.label}
                className="flex items-center gap-2 p-3 bg-green-50 rounded-lg"
              >
                <span className="text-lg">{adv.icon}</span>
                <span className="text-sm font-medium text-green-800">{adv.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Services publics proches + Prix carburants */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ServicesPublics />
        <CarburantsPrix />
      </div>

      {/* La Poste */}
      <LaPoste />

      {/* Conseils & Actualites */}
      <NewsTips />
    </div>
  );
}
