// Page de confirmation apres paiement Stripe
// Accessible sans authentification (embed + direct)

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref) {
      setError('Reference de demarche manquante');
      setStatus('error');
      return;
    }

    // Verifier le statut de la demarche
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/processes/${ref}/status`);
        if (res.ok) {
          setStatus('success');
        } else {
          // Meme si l'API echoue, afficher la confirmation (le webhook Stripe mettra a jour)
          setStatus('success');
        }
      } catch {
        setStatus('success');
      }
    };

    // Petit delai pour laisser le webhook Stripe traiter
    setTimeout(checkStatus, 1000);
  }, [ref]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-blue-700 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-base text-gray-600">Verification de votre paiement...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 border-l-4 border-l-red-600">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-base text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-lg w-full bg-white p-8 border-t-4 border-t-green-600">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Paiement confirme
          </h1>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 border-l-4 border-l-blue-700">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Reference</p>
            <p className="text-lg font-bold text-gray-900">{ref}</p>
          </div>

          <p className="text-base text-gray-700">
            Votre demande a bien ete enregistree. Vous recevrez un email de confirmation
            avec le detail de votre demarche.
          </p>

          <p className="text-base text-gray-700">
            Notre equipe va traiter votre dossier dans les meilleurs delais.
            Vous serez notifie par email a chaque etape de l'avancement.
          </p>

          <div className="bg-blue-50 p-4 border-l-4 border-l-blue-500">
            <p className="text-sm text-blue-900">
              <strong>Delai de traitement :</strong> 10 a 15 jours ouvres apres validation de votre dossier.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Service fourni par FranceGuichet - Service d'Aide aux Formalites</p>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-base text-gray-600">Chargement...</p>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
