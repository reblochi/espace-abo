// Formulaire complet pour demande de carte d'identite

'use client';

import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import {
  identityCardSchema,
  STEP_FIELDS,
  type IdentityCardInput,
} from '@/schemas/identity-card';
import { FRANCE_COUNTRY_ID, calculateStampTax } from '@/types/identity-card';

// Import des etapes
import { StepRequestType } from './steps/StepRequestType';
import { StepIdentity } from './steps/StepIdentity';
import { StepParents } from './steps/StepParents';
import { StepRequester } from './steps/StepRequester';
import { StepContact } from './steps/StepContact';
import { StepSummary, type PaymentMode } from './steps/StepSummary';

export interface IdentityCardFormProps {
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
    id: 'requestType',
    title: 'Motif',
    description: 'Selectionnez le motif de votre demande',
  },
  {
    id: 'identity',
    title: 'Identite',
    description: 'Informations du titulaire de la carte d\'identite',
  },
  {
    id: 'parents',
    title: 'Filiation',
    description: 'Informations sur vos parents',
  },
  {
    id: 'requester',
    title: 'Demandeur',
    description: 'Coordonnees et adresse de livraison',
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

export function IdentityCardForm({
  isSubscriber = false,
  basePrice,
  embedPartner,
  onComplete,
  onCheckout,
}: IdentityCardFormProps) {
  const isEmbed = !!embedPartner;

  const STEPS = React.useMemo(() => {
    const steps = [...BASE_STEPS];
    if (isEmbed) steps.push(CONTACT_STEP);
    steps.push(SUMMARY_STEP);
    return steps;
  }, [isEmbed]);

  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = React.useState(false);
  const [paymentMode, setPaymentMode] = React.useState<PaymentMode>('subscription');
  const [subscriptionConsent, setSubscriptionConsent] = React.useState(false);

  const methods = useForm<IdentityCardInput>({
    resolver: zodResolver(identityCardSchema),
    defaultValues: {
      motif: undefined,
      gender: undefined,
      nom: '',
      nomUsage: '',
      typeNomUsage: undefined,
      motAdditionnelNom: undefined,
      prenom: '',
      birthDate: '',
      birthCountryId: FRANCE_COUNTRY_ID,
      birthCityId: undefined,
      birthCityName: '',
      taille: undefined as unknown as number,
      raisonFrancais: '',
      fatherUnknown: false,
      fatherLastName: '',
      fatherFirstName: '',
      fatherBirthDate: '',
      fatherNationalityId: undefined,
      fatherBirthCity: '',
      motherUnknown: false,
      motherLastName: '',
      motherFirstName: '',
      motherBirthDate: '',
      motherNationalityId: undefined,
      motherBirthCity: '',
      isTitulaire: true,
      requesterGender: undefined,
      requesterLastName: '',
      requesterFirstName: '',
      requesterBirthDate: '',
      telephone: '',
      email: '',
      emailConfirm: '',
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

  const { handleSubmit, trigger, formState: { errors: formErrors } } = methods;

  // Validation de l'etape courante
  const validateCurrentStep = async (): Promise<boolean> => {
    const stepId = STEPS[currentStep]?.id;
    const fieldsToValidate = STEP_FIELDS[stepId];
    if (!fieldsToValidate || fieldsToValidate.length === 0) return true;
    return await trigger(fieldsToValidate);
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < STEPS.length - 1) {
      setError(null);
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setError(null);
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFormSubmit = async (data: IdentityCardInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const stampTax = calculateStampTax(data.motif, data.deliveryAddress?.zipCode);

      // Mode embed: endpoint public sans authentification
      if (isEmbed) {
        const response = await fetch('/api/embed/carte-identite', {
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
      if (!isSubscriber && paymentMode === 'subscription' && !subscriptionConsent) {
        setError('Veuillez accepter les conditions de l\'abonnement pour continuer.');
        setIsSubmitting(false);
        return;
      }

      if (isSubscriber && stampTax === 0) {
        // Abonne sans timbre fiscal : creation directe
        const response = await fetch('/api/processes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'IDENTITY_CARD',
            isFromSubscription: true,
            stampTaxCents: 0,
            data,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || 'Une erreur est survenue');
          return;
        }

        onComplete(result.process.reference);
      } else if (isSubscriber && stampTax > 0) {
        // Abonne avec timbre fiscal : passer par checkout pour payer le timbre
        const response = await fetch('/api/processes/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'IDENTITY_CARD',
            paymentMode: 'one_time',
            isFromSubscription: true,
            stampTaxCents: stampTax,
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
      } else {
        const response = await fetch('/api/processes/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'IDENTITY_CARD',
            paymentMode,
            stampTaxCents: stampTax,
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
      setError('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'requestType':
        return <StepRequestType />;
      case 'identity':
        return <StepIdentity />;
      case 'parents':
        return <StepParents />;
      case 'requester':
        return <StepRequester />;
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
      <form onSubmit={(e) => {
        // Empecher le submit par Enter sur un champ texte (sauf si on est a la derniere etape)
        if (currentStep < STEPS.length - 1) {
          e.preventDefault();
          return;
        }
        setHasAttemptedSubmit(true);
        handleSubmit(handleFormSubmit, (validationErrors) => {
          const messages: string[] = [];
          const flatErrors = (obj: Record<string, unknown>): void => {
            for (const [, val] of Object.entries(obj)) {
              if (val && typeof val === 'object' && 'message' in val && typeof (val as { message: unknown }).message === 'string') {
                messages.push((val as { message: string }).message);
              } else if (val && typeof val === 'object') {
                flatErrors(val as Record<string, unknown>);
              }
            }
          };
          flatErrors(validationErrors as Record<string, unknown>);
          if (messages.length > 0) {
            setError('Veuillez corriger les erreurs : ' + messages.join(', '));
          }
        })(e);
      }} className="space-y-6">
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

export default IdentityCardForm;
