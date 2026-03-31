// Page de succes apres souscription

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Button, Alert, Spinner } from '@/components/ui';

function AbonnementSuccesContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifySubscription = async () => {
      if (!sessionId) {
        setError('Session invalide');
        setIsLoading(false);
        return;
      }

      try {
        // Verifier et finaliser l'abonnement
        const response = await fetch(`/api/subscriptions/verify?session_id=${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Erreur lors de la verification');
          return;
        }

        setSubscription(data.subscription);
      } catch (err) {
        setError('Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    verifySubscription();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <Spinner className="w-12 h-12 text-blue-600 mb-4" />
        <p className="text-gray-600">Verification de votre abonnement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
          <div className="text-center">
            <Link href="/abonnement">
              <Button>Retour aux tarifs</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Icone de succes */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Merci pour votre abonnement !
          </h1>
          <p className="text-gray-600">
            Votre abonnement est maintenant actif
          </p>
        </div>

        <Card>
          <CardContent className="py-6">
            {subscription && (
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Référence</span>
                  <span className="font-medium">{subscription.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Montant mensuel</span>
                  <span className="font-medium">
                    {(subscription.amountCents / 100).toFixed(2).replace('.', ',')} EUR
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Prochaine échéance</span>
                  <span className="font-medium">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Que faire maintenant ?</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Vous recevrez un email de confirmation
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Vous pouvez lancer vos demarches immediatement
                </li>
                <li className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Gérez votre abonnement depuis votre espace membre
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-3">
          <Link href="/nouvelle-demarche" className="block">
            <Button className="w-full" size="lg">
              Lancer ma premiere demarche
            </Button>
          </Link>
          <Link href="/espace-membre" className="block">
            <Button variant="outline" className="w-full">
              Acceder a mon espace
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AbonnementSuccesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <Spinner className="w-12 h-12 text-blue-600 mb-4" />
        <p className="text-gray-600">Verification de votre abonnement...</p>
      </div>
    }>
      <AbonnementSuccesContent />
    </Suspense>
  );
}
