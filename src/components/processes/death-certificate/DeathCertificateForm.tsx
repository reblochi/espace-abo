// Formulaire complet pour acte de deces

'use client';

import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import {
  deathCertificateSchema,
  type DeathCertificateInput,
} from '@/schemas/death-certificate';
import { RecordType, FRANCE_COUNTRY_ID } from '@/types/death-certificate';
import { useFormTracking } from '@/hooks/useFormTracking';

// Import des etapes
import { getPricingProfile } from '@/lib/process-types';
import { StepActType } from './steps/StepActType';
import { StepBeneficiary } from './steps/StepBeneficiary';
import { StepClaimer } from './steps/StepClaimer';
import { SharedStepRequester } from '@/components/processes/shared/StepRequester';
import { StepSummary, type PaymentMode } from './steps/StepSummary';

export interface DeathCertificateFormProps {
  isSubscriber?: boolean;
  basePrice: number; // en centimes
  embedPartner?: string; // Si defini, mode embed sans auth
  pricingCode?: string; // Code profil pricing (AB testing)
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
    description: 'Selectionnez le type d\'extrait souhaite et les informations du deces',
  },
  {
    id: 'beneficiary',
    title: 'Personne decedee',
    description: 'Informations de la personne concernee par l\'acte',
  },
  {
    id: 'claimer',
    title: 'Demandeur',
    description: 'Votre lien avec le defunt',
  },
  {
    id: 'requester',
    title: 'Demandeur',
    description: 'Coordonnees et adresse de livraison',
  },
];

const SUMMARY_STEP: Step = {
  id: 'summary',
  title: 'Recapitulatif',
  description: 'Verification et validation de votre demande',
};

export function DeathCertificateForm({
  isSubscriber = false,
  basePrice: rawBasePrice,
  embedPartner,
  pricingCode,
  onComplete,
  onCheckout,
}: DeathCertificateFormProps) {
  const isEmbed = !!embedPartner;
  const pricing = getPricingProfile(pricingCode);
  const basePrice = pricing.basePrice;

  // Construire les etapes
  const STEPS = React.useMemo(() => {
    const steps = [...BASE_STEPS];
    steps.push(SUMMARY_STEP);
    return steps;
  }, []);

  // Tracking analytics
  const tracking = useFormTracking({
    formType: 'CIVIL_STATUS_DEATH',
    partner: embedPartner || undefined,
    pricingCode: pricingCode || undefined,
    source: isEmbed ? (embedPartner === 'direct' ? 'direct' : 'embed') : 'direct',
  });

  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [detectedSubscriber, setDetectedSubscriber] = React.useState(false);
  const initialPaymentMode: PaymentMode = pricing.paymentMode === 'one_time' ? 'one_time' : 'subscription';
  const [paymentMode, setPaymentMode] = React.useState<PaymentMode>(initialPaymentMode);
  const [subscriptionConsent, setSubscriptionConsent] = React.useState(pricing.paymentMode === 'subscription');

  const methods = useForm<DeathCertificateInput>({
    resolver: zodResolver(deathCertificateSchema),
    defaultValues: {
      recordType: RecordType.COPIE_INTEGRALE,
      recordCount: 3,
      deathDate: '',
      deathCountryId: FRANCE_COUNTRY_ID,
      deathCityId: undefined,
      deathCityName: '',
      gender: undefined,
      firstName: '',
      lastName: '',
      birthDate: '',
      claimerType: undefined,
      deliveryAddress: {
        street: '',
        zipCode: '',
        city: '',
        country: 'FR',
      },
      email: '',
      emailConfirm: '',
      telephone: '',
      consents: {
        acceptTerms: false as unknown as true,
        acceptDataProcessing: false as unknown as true,
        certifyAccuracy: false as unknown as true,
        retractationExecution: false as unknown as true,
        retractationRenonciation: false as unknown as true,
      },
    },
    mode: 'onSubmit',
  });

  const { handleSubmit, trigger } = methods;

  // Track step changes + hash pour bouton retour navigateur
  React.useEffect(() => {
    tracking.trackStepEntered(currentStep, STEPS[currentStep]?.id || 'unknown');
    if (currentStep > 0) {
      const hash = `#step-${currentStep}`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    } else if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // Intercepter le bouton retour du navigateur
  React.useEffect(() => {
    const handleHashChange = () => {
      const match = window.location.hash.match(/^#step-(\d+)$/);
      const hashStep = match ? parseInt(match[1], 10) : 0;
      if (hashStep < currentStep) {
        setError(null);
        setCurrentStep(hashStep);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentStep]);

  // Champs a valider par etape (dynamique selon mode embed)
  const stepFieldsMap: Record<string, (keyof DeathCertificateInput)[]> = {
    actType: ['recordType', 'recordCount', 'deathDate', 'deathCountryId', 'deathCityName'],
    beneficiary: ['gender', 'firstName', 'lastName', 'birthDate'],
    claimer: ['claimerType'],
    requester: ['email', 'emailConfirm', 'telephone', 'deliveryAddress'],
    summary: ['consents'],
  };

  // Validation de l'etape courante
  const validateCurrentStep = async (): Promise<boolean> => {
    const stepId = STEPS[currentStep]?.id;
    const fieldsToValidate = stepFieldsMap[stepId];
    if (!fieldsToValidate || fieldsToValidate.length === 0) return true;
    const fieldsValid = await trigger(fieldsToValidate);
    if (stepId === 'requester') {
      let valid = true;
      const values = methods.getValues();
      if (values.email !== values.emailConfirm) {
        methods.setError('emailConfirm', { type: 'manual', message: 'Les 2 adresses email ne sont pas identiques' });
        valid = false;
      }
      const tel = values.telephone?.replace(/[\s\-.]/g, '') || '';
      if (!/^0[0-9]{9}$/.test(tel)) {
        methods.setError('telephone', { type: 'manual', message: 'Format invalide (exemple : 06 12 34 56 78)' });
        valid = false;
      }
      if (!fieldsValid) return false;
      return valid;
    }
    return fieldsValid;
  };

  const scrollFormTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.parent !== window) {
      window.parent.postMessage({ source: 'advercity-widget', type: 'scrollTop' }, '*');
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < STEPS.length - 1) {
      tracking.trackStepCompleted(currentStep, STEPS[currentStep].id);

      // Verifier si l'email correspond a un abonne au moment de quitter l'etape demandeur
      const stepId = STEPS[currentStep].id;
      if (stepId === 'requester') {
        const values = methods.getValues();
        if (values.email || values.telephone) {
          try {
            const res = await fetch('/api/embed/check-subscriber', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: values.email, phone: values.telephone }),
            });
            const data = await res.json();
            if (data.isSubscriber) {
              setDetectedSubscriber(true);
            }
          } catch {
            // Silencieux en cas d'erreur reseau
          }
        }
      }

      setCurrentStep(currentStep + 1);
      scrollFormTop();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setError(null);
      const targetStepId = STEPS[currentStep - 1]?.id;
      if (targetStepId === 'requester') {
        setDetectedSubscriber(false);
      }
      setCurrentStep(currentStep - 1);
      scrollFormTop();
    }
  };

  const handleFormSubmit = async (data: DeathCertificateInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Mode embed: endpoint public sans authentification
      if (isEmbed) {
        const response = await fetch('/api/embed/acte-deces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partner: embedPartner,
            pricingCode,
            source: isEmbed ? (embedPartner === 'direct' ? 'direct' : 'embed') : 'direct',
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
          tracking.trackFormCompleted();
          onCheckout(result.url);
        } else if (result.reference) {
          tracking.trackFormCompleted();
          onComplete(result.reference);
        }
        return;
      }

      // Mode connecte standard
      const effectiveSubscriber = isSubscriber || detectedSubscriber;

      // Validation du consentement abonnement si mode subscription
      if (!effectiveSubscriber && paymentMode === 'subscription' && !subscriptionConsent) {
        setError('Veuillez accepter les conditions de l\'abonnement pour continuer.');
        setIsSubmitting(false);
        return;
      }

      if (effectiveSubscriber) {
        // Creer directement la demarche (deja abonne)
        const response = await fetch('/api/processes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'CIVIL_STATUS_DEATH',
            isFromSubscription: true,
            pricingCode,
            source: 'direct',
            data,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || 'Une erreur est survenue');
          return;
        }

        tracking.trackFormCompleted(result.process?.id);
        onComplete(result.process.reference);
      } else {
        // Creer une session checkout (abonnement ou paiement unique)
        const response = await fetch('/api/processes/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'CIVIL_STATUS_DEATH',
            paymentMode,
            pricingCode,
            source: 'direct',
            data,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || 'Une erreur est survenue');
          return;
        }

        if (result.url) {
          tracking.trackFormCompleted();
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
      case 'actType':
        return <StepActType />;
      case 'beneficiary':
        return <StepBeneficiary />;
      case 'claimer':
        return <StepClaimer />;
      case 'requester':
        return <SharedStepRequester />;
      case 'summary':
        return (
          <StepSummary
            isSubscriber={isSubscriber || detectedSubscriber}
            basePrice={basePrice}
            pricing={pricing}
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
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
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
          <CardContent className="pt-6">
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
            <Button type="button" disabled={isSubmitting} onClick={() => {
              const consents = methods.getValues('consents');
              const allChecked = consents.acceptTerms && consents.acceptDataProcessing && consents.certifyAccuracy && consents.retractationExecution && consents.retractationRenonciation;
              if (!allChecked) {
                const val = true as unknown as true;
                methods.setValue('consents.acceptTerms', val, { shouldValidate: true });
                methods.setValue('consents.acceptDataProcessing', val, { shouldValidate: true });
                methods.setValue('consents.certifyAccuracy', val, { shouldValidate: true });
                methods.setValue('consents.retractationExecution', val, { shouldValidate: true });
                methods.setValue('consents.retractationRenonciation', val, { shouldValidate: true });
                if (pricing.paymentMode !== 'one_time') {
                  setPaymentMode('subscription');
                  setSubscriptionConsent(true);
                }
              }
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
              })();
            }}>
              {isSubmitting ? (
                'Traitement...'
              ) : (() => {
                const consents = methods.getValues('consents');
                const anyChecked = consents.acceptTerms || consents.acceptDataProcessing || consents.certifyAccuracy || consents.retractationExecution || consents.retractationRenonciation;
                if (!anyChecked) {
                  return isSubscriber || detectedSubscriber
                    ? 'Tout accepter et valider'
                    : paymentMode === 'subscription'
                    ? 'Tout accepter et souscrire'
                    : 'Tout accepter et payer';
                }
                return isSubscriber || detectedSubscriber
                  ? 'Valider ma demande'
                  : paymentMode === 'subscription'
                  ? 'Souscrire et valider'
                  : 'Proceder au paiement';
              })()}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

export default DeathCertificateForm;
