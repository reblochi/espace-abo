// Page tunnel d'abonnement - Tarifs et souscription

'use client';

import { Suspense, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Alert, Spinner, Logo } from '@/components/ui';

// Configuration des plans (a mettre dans env ou DB en production)
const PLANS = [
  {
    id: 'basic',
    name: 'Abonnement Mensuel',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID || 'price_xxx',
    price: 9.90,
    period: 'mois',
    features: [
      'Démarches administratives illimitées',
      'Courriers types pré-remplis (3/mois)',
      'Lettres de résiliation, mise en demeure, préavis...',
      'Services publics localisés',
      'Suivi en temps réel de vos dossiers',
      'Coffre-fort numérique (bientôt)',
      'Support prioritaire',
      'Sans engagement, résiliable à tout moment',
    ],
    popular: true,
  },
];

function AbonnementContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const canceled = searchParams.get('canceled');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptCgv, setAcceptCgv] = useState(false);

  const handleSubscribe = async (priceId: string) => {
    // Si non connecte, rediriger vers inscription
    if (!session) {
      router.push(`/register?callbackUrl=/abonnement`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue');
        return;
      }

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              {session ? (
                <Link href="/espace-membre">
                  <Button variant="outline">Mon espace</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Connexion</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Inscription</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Simplifiez vos demarches administratives
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Un abonnement, des démarches illimitées. Plus besoin de payer a chaque demande.
          </p>
        </div>
      </section>

      {/* Alerts */}
      <div className="max-w-4xl mx-auto px-4">
        {canceled && (
          <Alert variant="warning" className="mb-8">
            Votre paiement a été annulé. Vous pouvez réessayer quand vous le souhaitez.
          </Alert>
        )}
        {error && (
          <Alert variant="error" className="mb-8">
            {error}
          </Alert>
        )}
      </div>

      {/* Plans */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-1 gap-8 max-w-md mx-auto">
            {PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.popular ? 'border-2 border-blue-500 shadow-lg' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-sm font-medium px-4 py-1 rounded-full">
                      Recommande
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price.toFixed(2).replace('.', ',')} EUR
                    </span>
                    <span className="text-gray-500">/{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="pb-8">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <svg
                          className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
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
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <label className="flex items-start gap-2 text-sm text-gray-600 mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptCgv}
                      onChange={(e) => setAcceptCgv(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      J&apos;accepte les{' '}
                      <a href="/cgv" target="_blank" className="text-blue-600 underline">
                        Conditions Générales de Vente
                      </a>
                    </span>
                  </label>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => handleSubscribe(plan.priceId)}
                    disabled={isLoading || !acceptCgv}
                  >
                    {isLoading ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Chargement...
                      </>
                    ) : (
                      "S'abonner maintenant"
                    )}
                  </Button>
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Sans engagement - Annulation a tout moment
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Pourquoi choisir l'abonnement ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Economique</h3>
              <p className="text-gray-600">
                Une demarche = 29,90 EUR. Avec l'abonnement a 9,90 EUR/mois, rentabilise des la 1ere demande.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Rapide</h3>
              <p className="text-gray-600">
                Plus de paiement a chaque demarche. Lancez vos demandes en quelques clics.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Sans risque</h3>
              <p className="text-gray-600">
                Sans engagement. Annulez a tout moment depuis votre espace membre.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Questions frequentes
          </h2>
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold mb-2">
                Quelles demarches sont incluses ?
              </h3>
              <p className="text-gray-600">
                Toutes les demarches d'etat civil (actes de naissance, mariage, deces)
                sont incluses dans l'abonnement sans limite de nombre.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold mb-2">
                Comment annuler mon abonnement ?
              </h3>
              <p className="text-gray-600">
                Vous pouvez annuler a tout moment depuis votre espace membre.
                Vos droits restent actifs jusqu'a la fin de la periode payee.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold mb-2">
                Quels moyens de paiement acceptez-vous ?
              </h3>
              <p className="text-gray-600">
                Nous acceptons les cartes bancaires (Visa, Mastercard, American Express)
                via notre partenaire de paiement securise Stripe.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default function AbonnementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Spinner className="w-12 h-12 text-blue-600" />
      </div>
    }>
      <AbonnementContent />
    </Suspense>
  );
}
