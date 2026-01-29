// Page tunnel commande demarche - Selection du type

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Button, Alert, Badge } from '@/components/ui';
import { PROCESS_TYPES, type ProcessTypeCode, formatPrice } from '@/lib/process-types';

export default function NouvelleDemarchePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  // Verifier l'abonnement
  useEffect(() => {
    const checkSubscription = async () => {
      if (!session?.user) {
        setIsLoadingSubscription(false);
        return;
      }

      try {
        const response = await fetch('/api/subscriptions/check');
        if (response.ok) {
          const data = await response.json();
          setHasActiveSubscription(data.isActive);
        }
      } catch (error) {
        console.error('Erreur verification abonnement:', error);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    if (status !== 'loading') {
      checkSubscription();
    }
  }, [session, status]);

  const handleSelectType = (typeCode: ProcessTypeCode) => {
    if (!session) {
      router.push(`/login?callbackUrl=/nouvelle-demarche/${typeCode.toLowerCase().replace(/_/g, '-')}`);
      return;
    }
    router.push(`/nouvelle-demarche/${typeCode.toLowerCase().replace(/_/g, '-')}`);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'baby':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'rings':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Espace Abo
            </Link>
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

      {/* Contenu */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Quelle demarche souhaitez-vous effectuer ?
          </h1>
          <p className="text-gray-600">
            Selectionnez le type de document que vous souhaitez obtenir
          </p>
        </div>

        {/* Info abonnement */}
        {!isLoadingSubscription && (
          <div className="mb-8">
            {hasActiveSubscription ? (
              <Alert variant="success">
                <div className="flex items-center justify-between">
                  <span>
                    <strong>Abonnement actif</strong> - Vos demarches sont incluses et illimitees
                  </span>
                  <Badge variant="success">Inclus</Badge>
                </div>
              </Alert>
            ) : (
              <Alert variant="default">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <span>
                    Pas encore abonne ? Profitez de demarches illimitees pour <strong>9,90 EUR/mois</strong>
                  </span>
                  <Link href="/abonnement">
                    <Button size="sm">S'abonner</Button>
                  </Link>
                </div>
              </Alert>
            )}
          </div>
        )}

        {/* Liste des types de demarches */}
        <div className="grid md:grid-cols-3 gap-6">
          {PROCESS_TYPES.map((processType) => (
            <Card
              key={processType.code}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleSelectType(processType.code)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600 group-hover:bg-blue-100 transition-colors">
                    {getIcon(processType.icon)}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{processType.label}</h3>
                  <p className="text-sm text-gray-500 mb-4">{processType.description}</p>
                  <div className="mt-auto">
                    {hasActiveSubscription ? (
                      <Badge variant="success">Inclus</Badge>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(processType.price)}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info supplementaire */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Besoin d'aide ? Consultez notre{' '}
            <Link href="/faq" className="text-blue-600 hover:underline">
              FAQ
            </Link>{' '}
            ou{' '}
            <Link href="/contact" className="text-blue-600 hover:underline">
              contactez-nous
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
