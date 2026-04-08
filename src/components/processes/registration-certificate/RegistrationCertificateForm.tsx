// Formulaire complet pour carte grise

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import {
  registrationCertificateSchema,
  type RegistrationCertificateInput,
} from '@/schemas/registration-certificate';
import { OperationType, VehicleState } from '@/types/registration-certificate';
import type { RegistrationCertificateTaxes } from '@/lib/taxes/registration-certificate';
import { useFormTracking } from '@/hooks/useFormTracking';

// Import des etapes
import { StepOperation } from './steps/StepOperation';
import { StepClaimer } from './steps/StepClaimer';
import { StepHolder } from './steps/StepHolder';
import { StepVehicle } from './steps/StepVehicle';
import { StepDocuments } from './steps/StepDocuments';
import { StepSummary, type PaymentMode } from './steps/StepSummary';
import { StepResetButton } from '@/components/processes/shared/StepResetButton';

export interface RegistrationCertificateFormProps {
  isSubscriber?: boolean;
  pricingCode?: string; // Code profil pricing (AB testing)
  partner?: string; // Partenaire embed
  canceledRef?: string; // Reference d'une demarche dont le paiement a ete annule
  onSubmit: (data: RegistrationCertificateInput, paymentMode?: PaymentMode) => Promise<void>;
  onTaxCalculation?: (taxes: RegistrationCertificateTaxes | null) => void;
  initialData?: Partial<RegistrationCertificateInput>;
  processRéférence?: string;
}

type Step = {
  id: string;
  title: string;
  description: string;
  fields: (keyof RegistrationCertificateInput)[];
};

const STEPS: Step[] = [
  {
    id: 'operation',
    title: 'Type d\'operation',
    description: 'Selectionnez le type de demarche',
    fields: ['operation'],
  },
  {
    id: 'claimer',
    title: 'Demandeur',
    description: 'Informations sur la personne qui fait la demande',
    fields: ['claimer'],
  },
  {
    id: 'holder',
    title: 'Titulaire',
    description: 'Informations sur le titulaire de la carte grise',
    fields: ['holder', 'coOwner'],
  },
  {
    id: 'vehicle',
    title: 'Vehicule',
    description: 'Informations sur le vehicule',
    fields: ['vehicle'],
  },
  {
    id: 'documents',
    title: 'Documents',
    description: 'Justificatifs necessaires',
    fields: [],
  },
  {
    id: 'summary',
    title: 'Recapitulatif',
    description: 'Verification et validation',
    fields: ['consents'],
  },
];

export function RegistrationCertificateForm({
  isSubscriber = false,
  pricingCode,
  partner,
  canceledRef,
  onSubmit,
  onTaxCalculation,
  initialData,
  processRéférence,
}: RegistrationCertificateFormProps) {
  const router = useRouter();

  // Tracking analytics
  const tracking = useFormTracking({
    formType: 'REGISTRATION_CERT',
    partner: partner || undefined,
    pricingCode: pricingCode || undefined,
    source: partner ? (partner === 'direct' ? 'direct' : 'embed') : 'direct',
  });

  const [currentStep, setCurrentStep] = React.useState(0);
  const [taxes, setTaxes] = React.useState<RegistrationCertificateTaxes | null>(null);
  const [isCalculatingTaxes, setIsCalculatingTaxes] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [canceledWarning, setCanceledWarning] = React.useState(false);
  const [paymentMode, setPaymentMode] = React.useState<PaymentMode>('subscription');
  const [subscriptionConsent, setSubscriptionConsent] = React.useState(false);

  const methods = useForm<RegistrationCertificateInput>({
    resolver: zodResolver(registrationCertificateSchema),
    defaultValues: initialData || {
      operation: {
        typeId: OperationType.CHANGEMENT_TITULAIRE,
      },
      claimer: {
        isHolder: true,
        civility: 1,
      },
      holder: {
        civility: 1,
        isCompany: false,
      },
      vehicle: {
        state: VehicleState.OCCASION,
        typeId: 1,
        energyId: 4, // Essence par defaut
      },
      consents: {
        acceptTerms: false,
        acceptDataProcessing: false,
        certifyAccuracy: false,
      },
    },
    mode: 'onChange',
  });

  const { handleSubmit, watch, trigger } = methods;
  const formValues = watch();

  // Calculer les taxes quand les donnees du vehicule changent
  React.useEffect(() => {
    const calculateTaxes = async () => {
      const vehicle = formValues.vehicle;
      const holder = formValues.holder;

      if (
        vehicle?.fiscalPower &&
        vehicle?.energyId &&
        vehicle?.state &&
        holder?.departmentCode
      ) {
        setIsCalculatingTaxes(true);
        try {
          const response = await fetch('/api/processes/taxes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vehicle: {
                fiscalPower: vehicle.fiscalPower,
                co2: vehicle.co2,
                energyId: vehicle.energyId,
                state: vehicle.state,
              },
              departmentCode: holder.departmentCode,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setTaxes(data.taxes);
            onTaxCalculation?.(data.taxes);
          }
        } catch {
          console.error('Erreur calcul taxes');
        } finally {
          setIsCalculatingTaxes(false);
        }
      }
    };

    const timeoutId = setTimeout(calculateTaxes, 500);
    return () => clearTimeout(timeoutId);
  }, [
    formValues.vehicle?.fiscalPower,
    formValues.vehicle?.co2,
    formValues.vehicle?.energyId,
    formValues.vehicle?.state,
    formValues.holder?.departmentCode,
    onTaxCalculation,
  ]);

  // Restaurer les donnees du formulaire apres annulation de paiement
  React.useEffect(() => {
    if (!canceledRef) return;
    const restore = async () => {
      try {
        const res = await fetch(`/api/processes/restore?ref=${encodeURIComponent(canceledRef)}`);
        if (!res.ok) return;
        const { data } = await res.json();
        if (data) {
          methods.reset(data);
          const summaryIndex = STEPS.findIndex(s => s.id === 'summary');
          setCurrentStep(summaryIndex >= 0 ? summaryIndex : STEPS.length - 1);
          setCanceledWarning(true);
        }
      } catch {
        // Silencieux en cas d'erreur
      }
    };
    restore();
  }, [canceledRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track step changes + history pour bouton retour navigateur
  React.useEffect(() => {
    tracking.trackStepEntered(currentStep, STEPS[currentStep]?.id || 'unknown');
    if (currentStep > 0) {
      window.history.pushState({ formStep: currentStep }, '');
    }
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const handlePopState = () => {
      if (currentStep > 0) {
        setCurrentStep((prev: number) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentStep]);

  // Validation de l'etape courante
  const validateCurrentStep = async (): Promise<boolean> => {
    const step = STEPS[currentStep];
    const fieldsToValidate = step.fields;

    if (fieldsToValidate.length === 0) return true;

    const isValid = await trigger(fieldsToValidate);
    return isValid;
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
      setCurrentStep(currentStep + 1);
      scrollFormTop();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      scrollFormTop();
    }
  };

  const handleFormSubmit = async (data: RegistrationCertificateInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!isSubscriber && paymentMode === 'subscription' && !subscriptionConsent) {
        setError('Veuillez accepter les conditions de l\'abonnement pour continuer.');
        setIsSubmitting(false);
        return;
      }

      tracking.trackFormCompleted();
      await onSubmit(data, paymentMode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'operation':
        return <StepOperation />;
      case 'claimer':
        return <StepClaimer />;
      case 'holder':
        return <StepHolder />;
      case 'vehicle':
        return <StepVehicle taxes={taxes} isCalculating={isCalculatingTaxes} />;
      case 'documents':
        return <StepDocuments processRéférence={processRéférence} />;
      case 'summary':
        return (
          <StepSummary
            taxes={taxes}
            isSubscriber={isSubscriber}
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
            {canceledWarning && (
              <Alert variant="warning" className="mb-6">
                Votre paiement a ete annule. Vos informations ont ete conservees. Vous pouvez reessayer quand vous le souhaitez.
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="mb-6">
                {error}
              </Alert>
            )}
            {STEPS[currentStep].id !== 'summary' && (
              <StepResetButton fields={STEPS[currentStep].fields} />
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
            <Button type="submit" isLoading={isSubmitting}>
              {isSubscriber
                ? 'Valider ma demande'
                : paymentMode === 'subscription'
                  ? 'Souscrire et valider ma demande'
                  : 'Proceder au paiement'
              }
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

export default RegistrationCertificateForm;
