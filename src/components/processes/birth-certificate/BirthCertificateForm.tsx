// Formulaire complet pour acte de naissance

'use client';

import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import {
  birthCertificateSchema,
  STEP_FIELDS,
  type BirthCertificateInput,
} from '@/schemas/birth-certificate';
import { RecordType, FRANCE_COUNTRY_ID } from '@/types/birth-certificate';

// Import des etapes
import { StepActType } from './steps/StepActType';
import { StepBeneficiary } from './steps/StepBeneficiary';
import { StepFiliation } from './steps/StepFiliation';
import { StepDelivery } from './steps/StepDelivery';
import { StepContact } from './steps/StepContact';
import { StepSummary, type PaymentMode } from './steps/StepSummary';

export interface BirthCertificateFormProps {
  isSubscriber?: boolean;
  basePrice: number; // en centimes
  embedPartner?: string; // Si defini, mode embed sans auth
  onComplete: (reference: string) => void;
  onCheckout: (checkoutUrl: string) => void;
}

type Step = {
  id: string;
  title: string;
  description: string;
};

const BASE_STEPS: Step[] = [
  {
    id: 'actType',
    title: 'Type d\'acte',
    description: 'Selectionnez le type d\'extrait souhaite',
  },
  {
    id: 'beneficiary',
    title: 'Beneficiaire',
    description: 'Informations de la personne concernee par l\'acte',
  },
  {
    id: 'filiation',
    title: 'Filiation',
    description: 'Lien avec le beneficiaire et informations des parents',
  },
  {
    id: 'delivery',
    title: 'Livraison',
    description: 'Adresse de reception de l\'acte',
  },
];

const CONTACT_STEP: Step = {
  id: 'contact',
  title: 'Coordonnees',
  description: 'Vos informations de contact pour le suivi',
};

const SUMMARY_STEP: Step = {
  id: 'summary',
  title: 'Recapitulatif',
  description: 'Verification et validation de votre demande',
};

export function BirthCertificateForm({
  isSubscriber = false,
  basePrice,
  embedPartner,
  onComplete,
  onCheckout,
}: BirthCertificateFormProps) {
  const isEmbed = !!embedPartner;

  // Construire les etapes: en mode embed, ajouter l'etape Coordonnees avant le recap
  const STEPS = React.useMemo(() => {
    const steps = [...BASE_STEPS];
    if (isEmbed) steps.push(CONTACT_STEP);
    steps.push(SUMMARY_STEP);
    return steps;
  }, [isEmbed]);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [paymentMode, setPaymentMode] = React.useState<PaymentMode>('subscription');
  const [subscriptionConsent, setSubscriptionConsent] = React.useState(false);

  const methods = useForm<BirthCertificateInput>({
    resolver: zodResolver(birthCertificateSchema),
    defaultValues: {
      recordType: RecordType.COPIE_INTEGRALE,
      recordCount: 1,
      gender: undefined,
      firstName: '',
      lastName: '',
      birthDate: '',
      birthCountryId: FRANCE_COUNTRY_ID,
      birthCityId: undefined,
      birthCityName: '',
      claimerType: undefined,
      fatherUnknown: false,
      fatherFirstName: '',
      fatherLastName: '',
      motherUnknown: false,
      motherFirstName: '',
      motherLastName: '',
      deliveryAddress: {
        street: '',
        zipCode: '',
        city: '',
        country: 'FR',
      },
      contact: isEmbed ? {
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
      } : undefined,
      consents: {
        acceptTerms: false as unknown as true,
        acceptDataProcessing: false as unknown as true,
        certifyAccuracy: false as unknown as true,
      },
    },
    mode: 'onChange',
  });

  const { handleSubmit, trigger } = methods;

  // Champs a valider par etape (dynamique selon mode embed)
  const stepFieldsMap: Record<string, (keyof BirthCertificateInput)[]> = {
    actType: ['recordType', 'recordCount'],
    beneficiary: ['gender', 'firstName', 'lastName', 'birthDate', 'birthCountryId', 'birthCityName'],
    filiation: ['claimerType'],
    delivery: ['deliveryAddress'],
    contact: ['contact'],
    summary: ['consents'],
  };

  // Validation de l'etape courante
  const validateCurrentStep = async (): Promise<boolean> => {
    const stepId = STEPS[currentStep]?.id;
    const fieldsToValidate = stepFieldsMap[stepId];
    if (!fieldsToValidate || fieldsToValidate.length === 0) return true;
    return await trigger(fieldsToValidate);
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFormSubmit = async (data: BirthCertificateInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Mode embed: endpoint public sans authentification
      if (isEmbed) {
        const response = await fetch('/api/embed/acte-naissance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partner: embedPartner,
            paymentMode,
            subscriptionConsent,
            data,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || 'Une erreur est survenue');
          return;
        }

        if (result.url) {
          onCheckout(result.url);
        } else if (result.reference) {
          onComplete(result.reference);
        }
        return;
      }

      // Mode connecte standard
      // Validation du consentement abonnement si mode subscription
      if (!isSubscriber && paymentMode === 'subscription' && !subscriptionConsent) {
        setError('Veuillez accepter les conditions de l\'abonnement pour continuer.');
        setIsSubmitting(false);
        return;
      }

      if (isSubscriber) {
        // Creer directement la demarche (deja abonne)
        const response = await fetch('/api/processes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'CIVIL_STATUS_BIRTH',
            isFromSubscription: true,
            data,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || 'Une erreur est survenue');
          return;
        }

        onComplete(result.process.reference);
      } else {
        // Creer une session checkout (abonnement ou paiement unique)
        const response = await fetch('/api/processes/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'CIVIL_STATUS_BIRTH',
            paymentMode,
            data,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || 'Une erreur est survenue');
          return;
        }

        if (result.url) {
          onCheckout(result.url);
        }
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'actType':
        return <StepActType />;
      case 'beneficiary':
        return <StepBeneficiary />;
      case 'filiation':
        return <StepFiliation />;
      case 'delivery':
        return <StepDelivery />;
      case 'contact':
        return <StepContact />;
      case 'summary':
        return (
          <StepSummary
            isSubscriber={isSubscriber}
            basePrice={basePrice}
            paymentMode={paymentMode}
            onPaymentModeChange={setPaymentMode}
            subscriptionConsent={subscriptionConsent}
            onSubscriptionConsentChange={setSubscriptionConsent}
          />
        );
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => index < currentStep && setCurrentStep(index)}
                    disabled={index > currentStep}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                      index < currentStep
                        ? 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'
                        : index === currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {index < currentStep ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </button>
                  <span className={cn(
                    'mt-2 text-xs font-medium hidden sm:block',
                    index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-2',
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Contenu de l'etape */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep].title}</CardTitle>
            <CardDescription>{STEPS[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="error" className="mb-6">
                {error}
              </Alert>
            )}
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Precedent
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext}>
              Suivant
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                'Traitement...'
              ) : isSubscriber ? (
                'Valider ma demande'
              ) : paymentMode === 'subscription' ? (
                'Souscrire et valider ma demande'
              ) : (
                'Proceder au paiement'
              )}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

export default BirthCertificateForm;
