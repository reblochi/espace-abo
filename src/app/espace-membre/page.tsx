// Page Dashboard Espace Membre

'use client';

import { useAuth, useSubscription, useProcesses } from '@/hooks';
import { DashboardStats, SubscriptionCard } from '@/components/dashboard';
import { ProcessCard } from '@/components/processes';
import { Card, CardHeader, CardTitle, CardContent, Button, Spinner } from '@/components/ui';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const { subscription, isActive, isLoading: subLoading } = useSubscription();
  const { processes, isLoading: processLoading } = useProcesses({ limit: 3 });

  const isLoading = subLoading || processLoading;

  // Stats pour le dashboard
  const stats = [
    {
      label: 'Demarches en cours',
      value: processes?.filter(p => p.status !== 'COMPLETED' && p.status !== 'CANCELED').length || 0,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: 'Demarches terminees',
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
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
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

      {/* Stats */}
      <DashboardStats stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Abonnement */}
        <SubscriptionCard />

        {/* Demarches recentes */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Demarches recentes</CardTitle>
              <Link href="/espace-membre/mes-demarches">
                <Button variant="ghost" size="sm">
                  Voir tout
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {processes && processes.length > 0 ? (
              <div className="space-y-4">
                {processes.slice(0, 3).map((process) => (
                  <div
                    key={process.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{process.type}</p>
                      <p className="text-sm text-gray-500">{process.reference}</p>
                    </div>
                    <Link href={`/espace-membre/mes-demarches/${process.reference}`}>
                      <Button variant="outline" size="sm">
                        Voir
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">Aucune demarche en cours</p>
                <Link href="/nouvelle-demarche">
                  <Button>Commencer une demarche</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/nouvelle-demarche" className="block">
              <div className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Nouvelle demarche</p>
                    <p className="text-sm text-gray-500">Commencer une procedure</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/espace-membre/mes-documents" className="block">
              <div className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Mes documents</p>
                    <p className="text-sm text-gray-500">Acceder a mes fichiers</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/espace-membre/mes-factures" className="block">
              <div className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Mes factures</p>
                    <p className="text-sm text-gray-500">Historique de paiements</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
