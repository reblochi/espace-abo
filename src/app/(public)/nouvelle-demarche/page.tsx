// Page tunnel commande demarche - Selection du type

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Button, Alert, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import {
  PROCESS_TYPES_CONFIG,
  PROCESS_CATEGORIES,
  type ProcessCategory,
  type ProcessTypeConfig,
  getProcessTypeSlug,
  getProcessTypesByCategory,
  formatPrice,
} from '@/lib/process-types';

export default function NouvelleDemarchePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<ProcessCategory | 'all'>('all');

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

  const handleSelectType = (config: ProcessTypeConfig) => {
    const slug = getProcessTypeSlug(config.code);
    if (!session) {
      router.push(`/login?callbackUrl=/nouvelle-demarche/${slug}`);
      return;
    }
    router.push(`/nouvelle-demarche/${slug}`);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'car':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
        );
      case 'baby':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'heart':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        );
      case 'shield-check':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        );
      case 'leaf':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.115 5.19l.319 1.913A6 6 0 008.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.076c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 002.288-4.042 1.087 1.087 0 00-.358-1.099l-1.33-1.108c-.251-.21-.582-.299-.905-.245l-1.17.195a1.125 1.125 0 01-.98-.314l-.295-.295a1.125 1.125 0 010-1.591l.13-.132a1.125 1.125 0 011.3-.21l.603.302a.809.809 0 001.086-1.086L14.25 7.5l1.256-.837a4.5 4.5 0 001.528-1.732l.146-.292M6.115 5.19A9 9 0 1017.18 4.64M6.115 5.19A8.965 8.965 0 0112 3c1.929 0 3.716.607 5.18 1.64" />
          </svg>
        );
      case 'id-card':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
          </svg>
        );
      case 'plane':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        );
      case 'credit-card':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
        );
      case 'building':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
          </svg>
        );
      case 'home':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        );
      case 'map':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 6.75V15m0-15l6-3 6 3v13.5l-6-3-6 3-6-3V6l6 3z" />
          </svg>
        );
      case 'scale':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
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

  // Filtrer les types de demarches
  const filteredTypes = selectedCategory === 'all'
    ? Object.values(PROCESS_TYPES_CONFIG)
    : getProcessTypesByCategory(selectedCategory);

  const categories = Object.entries(PROCESS_CATEGORIES) as [ProcessCategory, { label: string; icon: string }][];

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
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Quelle demarche souhaitez-vous effectuer ?
          </h1>
          <p className="text-gray-600">
            Selectionnez le type de document ou demarche administrative
          </p>
        </div>

        {/* Info abonnement */}
        {!isLoadingSubscription && (
          <div className="mb-8">
            {hasActiveSubscription ? (
              <Alert variant="success">
                <div className="flex items-center justify-between">
                  <span>
                    <strong>Abonnement actif</strong> - Vos frais de service sont inclus pour toutes les demarches
                  </span>
                  <Badge variant="success">Abonne</Badge>
                </div>
              </Alert>
            ) : (
              <Alert variant="default">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <span>
                    Pas encore abonne ? Profitez de frais de service offerts pour <strong>9,90 EUR/mois</strong>
                  </span>
                  <Link href="/abonnement">
                    <Button size="sm">S'abonner</Button>
                  </Link>
                </div>
              </Alert>
            )}
          </div>
        )}

        {/* Filtres par categorie */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
              }`}
            >
              Toutes les demarches
            </button>
            {categories.map(([category, { label }]) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des types de demarches */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTypes.map((config) => (
            <Card
              key={config.code}
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => handleSelectType(config)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                      {getIcon(config.icon)}
                    </div>
                    {config.hasTaxes && (
                      <Badge variant="outline" className="text-xs">
                        + taxes
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{config.label}</h3>
                  <p className="text-sm text-gray-500 mb-4 flex-grow">{config.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-xs text-gray-400">
                      Delai: {config.estimatedDelay}
                    </span>
                    {hasActiveSubscription && config.includedInSubscription ? (
                      <Badge variant="success" className="text-xs">Frais inclus</Badge>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(config.basePrice)}
                        {config.hasTaxes && <span className="text-xs text-gray-500">*</span>}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Note taxes */}
        <p className="text-center text-sm text-gray-500 mt-8">
          * Les demarches avec la mention "+ taxes" sont soumises a des taxes officielles
          (taxe regionale, malus ecologique...) qui s'ajoutent aux frais de service.
        </p>

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
