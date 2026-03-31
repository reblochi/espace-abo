// Page de confirmation de desabonnement

'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Button, Alert, Spinner, Logo } from '@/components/ui';

function ConfirmUnsubscribeForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isValidating, setIsValidating] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    reference: string;
    amount: string;
    currentPeriodEnd: string;
    email: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Valider le token au chargement
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenError('Lien invalide. Aucun token fourni.');
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(`/api/unsubscribe/confirm?token=${token}`);
        const data = await response.json();

        if (!data.valid) {
          setTokenError(data.error || 'Lien invalide ou expire.');
        } else {
          setSubscriptionInfo({
            reference: data.reference,
            amount: data.amount,
            currentPeriodEnd: data.currentPeriodEnd,
            email: data.email,
          });
        }
      } catch {
        setTokenError('Erreur lors de la verification du lien.');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/unsubscribe/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue');
        return;
      }

      setSuccess(true);
      setEndDate(data.endDate);
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Chargement initial
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Spinner className="h-8 w-8" />
          </div>
          <p className="mt-4 text-center text-gray-600">
            Verification du lien en cours...
          </p>
        </div>
      </div>
    );
  }

  // Token invalide
  if (tokenError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Lien invalide
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardContent className="py-8 px-6">
              <Alert variant="error" className="mb-4">
                {tokenError}
              </Alert>

              <p className="text-sm text-gray-600 mb-4">
                Ce lien de resiliation est peut-etre deja utilise ou invalide.
                Veuillez faire une nouvelle demande.
              </p>

              <div className="space-y-3">
                <Link href="/desabonnement">
                  <Button className="w-full">
                    Nouvelle demande
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Retour a l'accueil
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Succes
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Abonnement resilie
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardContent className="py-8 px-6">
              <Alert variant="success" className="mb-4">
                Votre abonnement a bien ete annule.
              </Alert>

              <p className="text-sm text-gray-600 mb-4">
                Vos droits restent actifs jusqu'au <strong>{endDate}</strong>.
                Vous pouvez continuer a utiliser vos services jusqu'a cette date.
              </p>

              <p className="text-sm text-gray-600 mb-6">
                Un email de confirmation vous a ete envoye.
              </p>

              <Link href="/">
                <Button variant="outline" className="w-full">
                  Retour a l'accueil
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Formulaire de confirmation
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <Logo size="lg" linked={false} />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Confirmer la resiliation
        </h2>
        {subscriptionInfo && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Compte: <strong>{subscriptionInfo.email}</strong>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="py-8 px-6">
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            {subscriptionInfo && (
              <div className="mb-6 space-y-3">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Référence</span>
                    <span className="font-medium text-gray-900">{subscriptionInfo.reference}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Montant mensuel</span>
                    <span className="font-medium text-gray-900">{subscriptionInfo.amount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Droits actifs jusqu'au</span>
                    <span className="font-medium text-gray-900">{subscriptionInfo.currentPeriodEnd}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  En confirmant, votre abonnement sera resilie a la fin de la periode en cours.
                  Vous conserverez vos droits jusqu'au {subscriptionInfo.currentPeriodEnd}.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleConfirm}
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? 'Resiliation en cours...' : 'Confirmer la resiliation'}
              </Button>

              <Link href="/">
                <Button variant="outline" className="w-full">
                  Annuler
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ConfirmUnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <Spinner className="h-8 w-8" />
      </div>
    }>
      <ConfirmUnsubscribeForm />
    </Suspense>
  );
}
