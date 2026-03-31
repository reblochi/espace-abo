// Page formulaire demarche specifique

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Alert, Spinner, Logo } from '@/components/ui';
import { CityAutocomplete, type City } from '@/components/forms';
import {
  getProcessTypeConfig,
  getProcessTypeFromSlug,
  type ActTypeCode,
  formatPrice,
} from '@/lib/process-types';
import { RegistrationCertificateForm } from '@/components/processes/registration-certificate';
import { BirthCertificateForm } from '@/components/processes/birth-certificate';
import { IdentityCardForm } from '@/components/processes/identity-card';

export default function FormulaireDemarchePage() {
  const routeParams = useParams<{ type: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();

  // Convertir le type URL vers le code
  const typeSlug = routeParams.type;
  const typeCode = getProcessTypeFromSlug(typeSlug);
  const processConfig = typeCode ? getProcessTypeConfig(typeCode) : undefined;

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  // Donnees du formulaire pour demarches simples (etat civil)
  const [formData, setFormData] = useState({
    actType: 'FULL_COPY' as ActTypeCode,
    beneficiaryFirstName: '',
    beneficiaryLastName: '',
    beneficiaryBirthDate: '',
    eventDate: '',
    eventCity: null as City | null,
    spouseFirstName: '',
    spouseLastName: '',
    deliveryAddress: {
      street: '',
      zipCode: '',
      city: '',
      country: 'FR',
    },
  });

  const isAuthenticated = status === 'authenticated';

  // Verifier l'abonnement (seulement si connecte)
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingSubscription(false);
      return;
    }

    const checkSubscription = async () => {
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

    checkSubscription();
  }, [isAuthenticated]);

  // Verifier si le type existe
  if (!processConfig || !typeCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <Alert variant="error" className="mb-4">
              Type de démarche non reconnu
            </Alert>
            <Link href="/nouvelle-demarche">
              <Button>Retour aux demarches</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  // ================================================
  // Pour les formulaires qui necessitent une session (carte grise, mariage, deces),
  // afficher un message de connexion si non authentifie
  // ================================================
  const needsAuth = typeCode !== 'CIVIL_STATUS_BIRTH';
  if (needsAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Logo size="md" />
              <Link href={`/login?callbackUrl=/nouvelle-demarche/${routeParams.type}`}>
                <Button>Se connecter</Button>
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>{processConfig.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-gray-600 mb-6">
                Connectez-vous ou créez un compte pour effectuer cette démarche.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href={`/login?callbackUrl=/nouvelle-demarche/${routeParams.type}`}>
                  <Button>Se connecter</Button>
                </Link>
                <Link href={`/register?callbackUrl=/nouvelle-demarche/${routeParams.type}`}>
                  <Button variant="outline">Créer un compte</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // ================================================
  // Formulaires speciaux (carte grise, etc.)
  // ================================================
  if (typeCode === 'REGISTRATION_CERT') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Logo size="md" />
              <Link href="/espace-membre">
                <Button variant="outline">Mon espace</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <nav className="mb-6">
            <ol className="flex items-center text-sm text-gray-500">
              <li>
                <Link href="/nouvelle-demarche" className="hover:text-blue-600">
                  Demarches
                </Link>
              </li>
              <li className="mx-2">/</li>
              <li className="font-medium text-gray-900">{processConfig.label}</li>
            </ol>
          </nav>
        </div>

        {/* Formulaire carte grise avance */}
        <main className="max-w-4xl mx-auto px-4 pb-12">
          <RegistrationCertificateForm
            isSubscriber={hasActiveSubscription}
            onSubmit={async (data, paymentMode) => {
              const response = await fetch('/api/processes/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'REGISTRATION_CERT',
                  paymentMode,
                  data,
                }),
              });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error || 'Erreur');
              if (result.url) {
                window.location.href = result.url;
              } else if (result.process?.reference) {
                router.push(`/nouvelle-demarche/confirmation?ref=${result.process.reference}`);
              }
            }}
          />
        </main>
      </div>
    );
  }

  // ================================================
  // Formulaire acte de naissance
  // ================================================
  if (typeCode === 'CIVIL_STATUS_BIRTH') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Logo size="md" />
              <Link href="/espace-membre">
                <Button variant="outline">Mon espace</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <nav className="mb-6">
            <ol className="flex items-center text-sm text-gray-500">
              <li>
                <Link href="/nouvelle-demarche" className="hover:text-blue-600">
                  Demarches
                </Link>
              </li>
              <li className="mx-2">/</li>
              <li className="font-medium text-gray-900">{processConfig.label}</li>
            </ol>
          </nav>
        </div>

        {/* Formulaire acte de naissance */}
        <main className="max-w-4xl mx-auto px-4 pb-12">
          <BirthCertificateForm
            isSubscriber={hasActiveSubscription}
            basePrice={processConfig.basePrice}
            embedPartner={!isAuthenticated ? 'direct' : undefined}
            onComplete={(reference) => {
              router.push(`/nouvelle-demarche/confirmation?ref=${reference}`);
            }}
            onCheckout={(checkoutUrl) => {
              window.location.href = checkoutUrl;
            }}
          />
        </main>
      </div>
    );
  }

  // ================================================
  // Formulaire carte d'identité
  // ================================================
  if (typeCode === 'IDENTITY_CARD') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Logo size="md" />
              <Link href="/espace-membre">
                <Button variant="outline">Mon espace</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <nav className="mb-6">
            <ol className="flex items-center text-sm text-gray-500">
              <li>
                <Link href="/nouvelle-demarche" className="hover:text-blue-600">
                  Demarches
                </Link>
              </li>
              <li className="mx-2">/</li>
              <li className="font-medium text-gray-900">{processConfig.label}</li>
            </ol>
          </nav>
        </div>

        {/* Formulaire carte d'identité */}
        <main className="max-w-4xl mx-auto px-4 pb-12">
          <IdentityCardForm
            isSubscriber={hasActiveSubscription}
            basePrice={processConfig.basePrice}
            onComplete={(reference) => {
              router.push(`/nouvelle-demarche/confirmation?ref=${reference}`);
            }}
            onCheckout={(checkoutUrl) => {
              window.location.href = checkoutUrl;
            }}
          />
        </main>
      </div>
    );
  }

  // ================================================
  // Formulaire generique (etat civil et autres)
  // ================================================
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.eventCity) {
        setError('Veuillez selectionner une commune');
        setIsLoading(false);
        return;
      }

      // Si abonne, creer directement
      if (hasActiveSubscription) {
        const response = await fetch('/api/processes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: typeCode,
            isFromSubscription: true,
            data: {
              actType: formData.actType,
              beneficiaryFirstName: formData.beneficiaryFirstName,
              beneficiaryLastName: formData.beneficiaryLastName,
              beneficiaryBirthDate: formData.beneficiaryBirthDate,
              eventDate: formData.eventDate,
              eventCityId: formData.eventCity.id,
              eventCityName: formData.eventCity.name,
              spouseFirstName: formData.spouseFirstName,
              spouseLastName: formData.spouseLastName,
              deliveryAddress: formData.deliveryAddress,
            },
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Une erreur est survenue');
          return;
        }

        // Rediriger vers la page de confirmation
        router.push(`/nouvelle-demarche/confirmation?ref=${data.process.reference}`);
      } else {
        // Creer une session Checkout pour paiement unique
        const response = await fetch('/api/processes/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: typeCode,
            data: {
              actType: formData.actType,
              beneficiaryFirstName: formData.beneficiaryFirstName,
              beneficiaryLastName: formData.beneficiaryLastName,
              beneficiaryBirthDate: formData.beneficiaryBirthDate,
              eventDate: formData.eventDate,
              eventCityId: formData.eventCity.id,
              eventCityName: formData.eventCity.name,
              spouseFirstName: formData.spouseFirstName,
              spouseLastName: formData.spouseLastName,
              deliveryAddress: formData.deliveryAddress,
            },
          }),
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
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const isMarriage = typeCode === 'CIVIL_STATUS_MARRIAGE';
  const isCivilStatus = ['CIVIL_STATUS_MARRIAGE', 'CIVIL_STATUS_DEATH'].includes(typeCode);

  // Si ce n'est pas un type etat civil, afficher un message generique
  if (!isCivilStatus) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Logo size="md" />
              <Link href="/espace-membre">
                <Button variant="outline">Mon espace</Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Contenu */}
        <main className="max-w-2xl mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>{processConfig.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Formulaire en cours de developpement
                </h3>
                <p className="text-gray-500 mb-6">
                  Le formulaire pour "{processConfig.label}" sera bientot disponible.
                  En attendant, vous pouvez nous contacter pour effectuer cette démarche.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href="/nouvelle-demarche">
                    <Button variant="outline">Retour aux demarches</Button>
                  </Link>
                  <Link href="/contact">
                    <Button>Nous contacter</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <Link href="/espace-membre">
              <Button variant="outline">Mon espace</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center text-sm text-gray-500">
            <li>
              <Link href="/nouvelle-demarche" className="hover:text-blue-600">
                Demarches
              </Link>
            </li>
            <li className="mx-2">/</li>
            <li className="font-medium text-gray-900">{processConfig.label}</li>
          </ol>
        </nav>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-20 h-1 mx-2 ${
                    step > s ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Informations du bénéficiaire'}
              {step === 2 && 'Lieu et date'}
              {step === 3 && 'Adresse de livraison'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Etape 1: Informations beneficiaire */}
            {step === 1 && (
              <div className="space-y-4">
                {processConfig.subtypes && processConfig.subtypes.length > 0 && (
                  <Select
                    label="Type d'acte"
                    value={formData.actType}
                    onChange={(e) =>
                      setFormData({ ...formData, actType: e.target.value as ActTypeCode })
                    }
                    required
                  >
                    {processConfig.subtypes.map((subtype) => (
                      <option key={subtype.code} value={subtype.code}>
                        {subtype.label}
                      </option>
                    ))}
                  </Select>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Prénom"
                    value={formData.beneficiaryFirstName}
                    onChange={(e) =>
                      setFormData({ ...formData, beneficiaryFirstName: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Nom"
                    value={formData.beneficiaryLastName}
                    onChange={(e) =>
                      setFormData({ ...formData, beneficiaryLastName: e.target.value })
                    }
                    required
                  />
                </div>

                {isMarriage && (
                  <>
                    <p className="text-sm font-medium text-gray-700 mt-4">Conjoint</p>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Prénom du conjoint"
                        value={formData.spouseFirstName}
                        onChange={(e) =>
                          setFormData({ ...formData, spouseFirstName: e.target.value })
                        }
                        required
                      />
                      <Input
                        label="Nom du conjoint"
                        value={formData.spouseLastName}
                        onChange={(e) =>
                          setFormData({ ...formData, spouseLastName: e.target.value })
                        }
                        required
                      />
                    </div>
                  </>
                )}

                <Input
                  label="Date de naissance"
                  type="date"
                  value={formData.beneficiaryBirthDate}
                  onChange={(e) =>
                    setFormData({ ...formData, beneficiaryBirthDate: e.target.value })
                  }
                  required
                />
              </div>
            )}

            {/* Etape 2: Lieu et date */}
            {step === 2 && (
              <div className="space-y-4">
                <Input
                  label={
                    typeCode === 'CIVIL_STATUS_MARRIAGE'
                      ? 'Date du mariage'
                      : 'Date du deces'
                  }
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) =>
                    setFormData({ ...formData, eventDate: e.target.value })
                  }
                  required
                />

                <CityAutocomplete
                  label={
                    typeCode === 'CIVIL_STATUS_MARRIAGE'
                      ? 'Commune du mariage'
                      : 'Commune du deces'
                  }
                  value={formData.eventCity}
                  onChange={(city) => setFormData({ ...formData, eventCity: city })}
                  required
                />
              </div>
            )}

            {/* Etape 3: Adresse de livraison */}
            {step === 3 && (
              <div className="space-y-4">
                <Input
                  label="Adresse"
                  value={formData.deliveryAddress.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryAddress: { ...formData.deliveryAddress, street: e.target.value },
                    })
                  }
                  placeholder="Numéro et nom de rue"
                  required
                />

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Code postal"
                    value={formData.deliveryAddress.zipCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryAddress: { ...formData.deliveryAddress, zipCode: e.target.value },
                      })
                    }
                    required
                  />
                  <div className="col-span-2">
                    <Input
                      label="Ville"
                      value={formData.deliveryAddress.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deliveryAddress: { ...formData.deliveryAddress, city: e.target.value },
                        })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Resume */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Recapitulatif</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Démarche :</span> {processConfig.label}
                    </p>
                    <p>
                      <span className="font-medium">Beneficiaire:</span>{' '}
                      {formData.beneficiaryFirstName} {formData.beneficiaryLastName}
                    </p>
                    <p>
                      <span className="font-medium">Commune:</span>{' '}
                      {formData.eventCity?.name} ({formData.eventCity?.postal_code})
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    {hasActiveSubscription ? (
                      <span className="text-green-600 font-bold">Inclus dans l'abonnement</span>
                    ) : (
                      <span className="text-xl font-bold">{formatPrice(processConfig.basePrice)}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Retour
                </Button>
              ) : (
                <Link href="/nouvelle-demarche">
                  <Button variant="outline">Annuler</Button>
                </Link>
              )}

              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)}>Continuer</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2" />
                      Traitement...
                    </>
                  ) : hasActiveSubscription ? (
                    'Valider ma demarche'
                  ) : (
                    'Payer et valider'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
