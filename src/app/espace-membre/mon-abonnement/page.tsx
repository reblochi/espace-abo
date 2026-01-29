// Page Mon Abonnement

'use client';

import { useState } from 'react';
import { useSubscription } from '@/hooks';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Alert,
  Modal,
  Spinner,
} from '@/components/ui';
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
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancel = async () => {
    setCancelError(null);
    try {
      cancel(undefined);
      setShowCancelModal(false);
    } catch (error) {
      setCancelError('Une erreur est survenue lors de la resiliation.');
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
              Souscrivez a notre offre pour beneficier de demarches illimitees et d'un suivi personnalise.
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
          Votre abonnement a ete resilie. Vous beneficiez encore de vos avantages jusqu'au {formatDate(subscription.endDate!)}.
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
              <dt className="text-sm text-gray-500">Reference</dt>
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
              <dt className="text-sm text-gray-500">Prochaine echeance</dt>
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
              Votre abonnement a expire. Reabonnez-vous pour continuer a beneficier de nos services.
            </p>
            <Button>
              Se reabonner
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal de confirmation resiliation */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Resilier mon abonnement"
        size="md"
      >
        <div className="space-y-4">
          {cancelError && (
            <Alert variant="error">{cancelError}</Alert>
          )}

          <p className="text-gray-600">
            Etes-vous sur de vouloir resilier votre abonnement ? Vous pourrez toujours utiliser nos services jusqu'a la fin de votre periode en cours ({formatDate(subscription.currentPeriodEnd)}).
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Ce que vous perdez :</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Acces aux demarches illimitees</li>
              <li>• Suivi personnalise de vos procedures</li>
              <li>• Assistance prioritaire</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowCancelModal(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleCancel}
              disabled={isCanceling}
            >
              {isCanceling ? 'Resiliation...' : 'Confirmer la resiliation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
