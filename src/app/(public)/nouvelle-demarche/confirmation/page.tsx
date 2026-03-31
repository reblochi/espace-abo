// Page de confirmation apres commande demarche

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Button, Alert, Spinner, Badge } from '@/components/ui';
import { getProcessTypeConfig, formatPrice } from '@/lib/process-types';
import type { ProcessType } from '@/types';

interface ProcessData {
  reference: string;
  type: ProcessType;
  status: string;
  isFromSubscription: boolean;
  pricePaid: number | null;
  data: Record<string, unknown>;
  createdAt: string;
}

function ConfirmationDemarcheContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref');
  const sessionId = searchParams.get('session_id');

  const [isLoading, setIsLoading] = useState(true);
  const [process, setProcess] = useState<ProcessData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAndGetProcess = async () => {
      if (!reference) {
        setError('Référence manquante');
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
          setError(data.error || 'Démarche non trouvée');
          return;
        }

        // L'API retourne l'objet directement (pas dans .process)
        setProcess(data.process || data);
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

  const processData = process?.data as Record<string, unknown>;
  const processConfig = process ? getProcessTypeConfig(process.type) : null;

  // Determine le type de demarche pour l'affichage
  const isVehicleProcess = process?.type === 'REGISTRATION_CERT';
  const isCivilStatusProcess = ['CIVIL_STATUS_BIRTH', 'CIVIL_STATUS_MARRIAGE', 'CIVIL_STATUS_DEATH'].includes(process?.type || '');

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
                  <span className="text-gray-500">Référence</span>
                  <span className="font-mono font-medium">{process.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium">
                    {processConfig?.label || process.type}
                  </span>
                </div>

                {/* Informations specifiques selon le type */}
                {isCivilStatusProcess && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Beneficiaire</span>
                      <span className="font-medium">
                        {processData?.beneficiaryFirstName as string} {processData?.beneficiaryLastName as string}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Commune</span>
                      <span className="font-medium">{processData?.eventCityName as string}</span>
                    </div>
                  </>
                )}

                {isVehicleProcess && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Immatriculation</span>
                      <span className="font-medium font-mono">
                        {(processData?.vehicle as Record<string, unknown>)?.registrationNumber as string}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vehicule</span>
                      <span className="font-medium">
                        {(processData?.vehicle as Record<string, unknown>)?.make as string} {(processData?.vehicle as Record<string, unknown>)?.model as string}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Titulaire</span>
                      <span className="font-medium">
                        {(processData?.holder as Record<string, unknown>)?.isCompany
                          ? (processData?.holder as Record<string, unknown>)?.companyName as string
                          : `${(processData?.holder as Record<string, unknown>)?.firstName} ${(processData?.holder as Record<string, unknown>)?.lastName}`}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-500">Statut</span>
                  <Badge
                    variant={
                      process.status === 'PAID' || process.status === 'SENT_TO_ADVERCITY'
                        ? 'info'
                        : process.status === 'IN_PROGRESS'
                        ? 'warning'
                        : process.status === 'COMPLETED'
                        ? 'success'
                        : 'default'
                    }
                  >
                    {process.status === 'PENDING_PAYMENT' && 'En attente de paiement'}
                    {process.status === 'PAID' && 'Payé'}
                    {process.status === 'SENT_TO_ADVERCITY' && 'En traitement'}
                    {process.status === 'IN_PROGRESS' && 'En cours'}
                    {process.status === 'AWAITING_INFO' && 'Info manquante'}
                    {process.status === 'COMPLETED' && 'Termine'}
                    {process.status === 'CANCELLED' && 'Annule'}
                    {process.status === 'REFUNDED' && 'Remboursé'}
                  </Badge>
                </div>

                {/* Montant paye */}
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-500">Montant</span>
                  {process.isFromSubscription ? (
                    <span className="text-green-600 font-medium">Inclus (abonnement)</span>
                  ) : process.pricePaid ? (
                    <span className="font-bold">{formatPrice(process.pricePaid)}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Prochaines etapes</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                {isVehicleProcess ? (
                  <>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-blue-600">1</span>
                      </div>
                      <span>Vos documents sont en cours de verification par nos equipes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-blue-600">2</span>
                      </div>
                      <span>Votre dossier est transmis à l'ANTS pour traitement</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-blue-600">3</span>
                      </div>
                      <span>Vous recevrez votre certificat d'immatriculation par courrier sous 5 a 7 jours ouvres</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-blue-600">1</span>
                      </div>
                      <span>Votre demande est transmise à la mairie concernée</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-blue-600">2</span>
                      </div>
                      <span>Vous recevrez un email a chaque mise à jour du statut</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-blue-600">3</span>
                      </div>
                      <span>Le document sera envoyé à l'adresse indiquée (délai moyen: 5-10 jours)</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Alerte info supplementaire pour carte grise */}
            {isVehicleProcess && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Important :</strong> Vous pouvez circuler avec votre certificat provisoire d'immatriculation (CPI)
                  pendant 1 mois a compter de la validation de votre dossier.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 space-y-3">
          <Link href={`/espace-membre/mes-demarches/${process?.reference || reference}`} className="block">
            <Button className="w-full" size="lg">
              Suivre ma demarche
            </Button>
          </Link>
          <Link href="/nouvelle-demarche" className="block">
            <Button variant="outline" className="w-full">
              Nouvelle démarche
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
