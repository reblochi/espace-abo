// Page Checkout - Cree une session Stripe et redirige
// Utilisee par les formulaires embed qui n'ont pas d'authentification

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const mode = searchParams.get('mode') || 'one_time';
  const partner = searchParams.get('partner');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref) {
      setError('Reference de demarche manquante');
      return;
    }

    const createCheckout = async () => {
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ref, mode, partner }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Erreur lors de la creation du paiement');
          return;
        }

        if (data.url) {
          window.location.href = data.url;
        } else {
          setError('URL de paiement non disponible');
        }
      } catch {
        setError('Erreur de connexion. Veuillez reessayer.');
      }
    };

    createCheckout();
  }, [ref, mode, partner]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 border-l-4 border-l-red-600">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-base text-red-800">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-700 text-white font-semibold hover:bg-blue-800"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <svg className="animate-spin h-8 w-8 text-blue-700 mx-auto mb-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-base text-gray-600">Redirection vers le paiement securise...</p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-base text-gray-600">Chargement...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
