// Page de confirmation apres commande demarche

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Button, Alert, Spinner } from '@/components/ui';

function ConfirmationDemarcheContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref');
  const sessionId = searchParams.get('session_id');

  const [isLoading, setIsLoading] = useState(true);
  const [process, setProcess] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAndGetProcess = async () => {
      if (!reference) {
        setError('Reference manquante');
        setIsLoading(false);
        return;
      }

      try {
        // Si on vient d'un paiement Stripe, verifier et finaliser
        if (sessionId) {
          const verifyResponse = await fetch(`/api/processes/verify?session_id=${sessionId}`);
          if (!verifyResponse.ok) {
            const data = await verifyResponse.json();
            setError(data.error || 'Erreur lors de la verification du paiement');
            setIsLoading(false);
            return;
          }
        }

        // Recuperer les details du process
        const response = await fetch(`/api/processes/${reference}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Demarche non trouvee');
          return;
        }

        setProcess(data.process);
      } catch (err) {
        setError('Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAndGetProcess();
  }, [reference, sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <Spinner className="w-12 h-12 text-blue-600 mb-4" />
        <p className="text-gray-600">Verification en cours...</p>
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
            <Link href="/nouvelle-demarche">
              <Button>Retour aux demarches</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const processData = process?.data as any;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
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
            Demarche enregistree !
          </h1>
          <p className="text-gray-600">
            Votre demande a bien ete prise en compte
          </p>
        </div>

        <Card>
          <CardContent className="py-6">
            {process && (
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-mono font-medium">{process.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium">
                    {process.type === 'CIVIL_STATUS_BIRTH' && 'Acte de naissance'}
                    {process.type === 'CIVIL_STATUS_MARRIAGE' && 'Acte de mariage'}
                    {process.type === 'CIVIL_STATUS_DEATH' && 'Acte de deces'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Beneficiaire</span>
                  <span className="font-medium">
                    {processData?.beneficiaryFirstName} {processData?.beneficiaryLastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Commune</span>
                  <span className="font-medium">{processData?.eventCityName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Statut</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    En traitement
                  </span>
                </div>
                {process.isFromSubscription && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Montant</span>
                    <span className="text-green-600 font-medium">Inclus (abonnement)</span>
                  </div>
                )}
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Prochaines etapes</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <span>Votre demande est transmise a la mairie concernee</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">2</span>
                  </div>
                  <span>Vous recevrez un email a chaque mise a jour du statut</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">3</span>
                  </div>
                  <span>Le document sera envoye a l'adresse indiquee (delai moyen: 5-10 jours)</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-3">
          <Link href="/espace-membre/demarches" className="block">
            <Button className="w-full" size="lg">
              Suivre ma demarche
            </Button>
          </Link>
          <Link href="/nouvelle-demarche" className="block">
            <Button variant="outline" className="w-full">
              Nouvelle demarche
            </Button>
          </Link>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Un email de confirmation vous a ete envoye a{' '}
          <span className="font-medium">{session?.user?.email}</span>
        </p>
      </div>
    </div>
  );
}

export default function ConfirmationDemarchePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <Spinner className="w-12 h-12 text-blue-600 mb-4" />
        <p className="text-gray-600">Chargement...</p>
      </div>
    }>
      <ConfirmationDemarcheContent />
    </Suspense>
  );
}
