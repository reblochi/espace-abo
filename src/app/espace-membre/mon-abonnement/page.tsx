// Page Mon Abonnement

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSubscription } from '@/hooks';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Alert,
  Spinner,
} from '@/components/ui';
import { showComingSoonToast } from '@/components/ui/coming-soon';
import { AdvantagesList } from '@/components/subscription/AdvantagesList';
import { CancellationFlow } from '@/components/subscription/CancellationFlow';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function MonAbonnementPage() {
  const {
    subscription,
    isActive,
    remainingDays,
    isLoading,
    cancel,
    isCanceling,
  } = useSubscription();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleCancel = async () => {
    try {
      cancel(undefined);
      setShowCancelModal(false);
    } catch {
      // handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon abonnement</h1>
          <p className="text-gray-500 mt-1">Gerez votre abonnement mensuel</p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun abonnement actif
            </h3>
            <p className="text-gray-500 mb-6">
              Souscrivez a notre offre pour bénéficier de démarches illimitées et d'un suivi personnalise.
            </p>
            <Button size="lg">
              Decouvrir l'offre
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; variant: 'success' | 'secondary' | 'destructive' }> = {
    ACTIVE: { label: 'Actif', variant: 'success' },
    CANCELED: { label: isActive ? `Actif (${remainingDays}j restants)` : 'Termine', variant: isActive ? 'success' : 'secondary' },
    PAST_DUE: { label: 'Paiement en retard', variant: 'destructive' },
    INCOMPLETE: { label: 'Incomplet', variant: 'secondary' },
  };

  const status = statusConfig[subscription.status] || { label: subscription.status, variant: 'secondary' as const };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon abonnement</h1>
        <p className="text-gray-500 mt-1">Gerez votre abonnement mensuel</p>
      </div>

      {/* Alertes */}
      {subscription.status === 'PAST_DUE' && (
        <Alert variant="error" title="Paiement en retard">
          Votre dernier paiement a echoue. Veuillez mettre a jour votre moyen de paiement pour eviter l'interruption de service.
        </Alert>
      )}

      {subscription.status === 'CANCELED' && isActive && (
        <Alert variant="warning" title="Abonnement resilie">
          Votre abonnement a ete resilie. Vous bénéficiez encore de vos avantages jusqu'au {formatDate(subscription.endDate!)}.
        </Alert>
      )}

      {/* Details abonnement */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Details de l'abonnement</CardTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-gray-500">Référence</dt>
              <dd className="mt-1 font-medium text-gray-900">{subscription.reference}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Montant mensuel</dt>
              <dd className="mt-1 font-medium text-gray-900">{formatCurrency(subscription.amountCents)}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Date de debut</dt>
              <dd className="mt-1 font-medium text-gray-900">{formatDate(subscription.startDate)}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Prochaine échéance</dt>
              <dd className="mt-1 font-medium text-gray-900">{formatDate(subscription.currentPeriodEnd)}</dd>
            </div>
            {subscription.endDate && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-gray-500">Fin des droits</dt>
                <dd className="mt-1 font-medium text-red-600">{formatDate(subscription.endDate)}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Pourquoi ce montant */}
      <Card>
        <CardHeader>
          <CardTitle>Pourquoi ce montant ?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              Votre abonnement a <strong>{formatCurrency(subscription.amountCents)}/mois</strong> vous donne un acces illimite a toutes nos demarches administratives et services associes.
            </p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="font-medium text-blue-800 mb-2">Le débit apparaît sur votre relevé sous :</p>
              <p className="font-mono text-blue-900">France Guichet</p>
            </div>
            <p className="text-xs text-gray-400">
              Le prélèvement est effectué automatiquement chaque mois à la date anniversaire de votre souscription.
            </p>
            {subscription.status !== 'CANCELED' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link href="/desabonnement" className="text-sm text-red-600 hover:text-red-800">
                  Se désabonner
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Avantages inclus */}
      <AdvantagesList />

      {/* Moyen de paiement */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Moyen de paiement</CardTitle>
            {subscription.status !== 'CANCELED' && (
              <Button variant="outline" size="sm">
                Modifier
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Carte bancaire</p>
              <p className="text-sm text-gray-500">**** **** **** 4242</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {subscription.status === 'ACTIVE' && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="flex-1">
                Modifier mon abonnement
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setShowCancelModal(true)}
              >
                Resilier mon abonnement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {subscription.status === 'CANCELED' && !isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Reabonnement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4">
              Votre abonnement a expire. Reabonnez-vous pour continuer a bénéficier de nos services.
            </p>
            <Button>
              Se reabonner
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Supprimer mon compte (RGPD) */}
      <Card>
        <CardHeader>
          <CardTitle>Donnees personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Conformement au RGPD, vous pouvez demander la suppression de votre compte et de toutes vos donnees personnelles.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
          >
            Supprimer mon compte
          </Button>
        </CardContent>
      </Card>

      {/* Parcours de retention */}
      <CancellationFlow
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        isCanceling={isCanceling}
        endDate={subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : undefined}
      />

      {/* Modal RGPD (coming soon) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Supprimer mon compte</h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 font-medium mb-2">Attention, cette action est irreversible :</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>- Suppression de toutes vos donnees personnelles</li>
                    <li>- Annulation de votre abonnement</li>
                    <li>- Perte de l'historique de vos demarches</li>
                    <li>- Suppression de vos documents</li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowDeleteModal(false)}>
                    Annuler
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => { setShowDeleteModal(false); showComingSoonToast(); }}>
                    Confirmer la suppression
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
