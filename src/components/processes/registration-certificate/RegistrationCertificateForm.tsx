// Formulaire carte grise — pattern moderne aligne sur BirthCertificateForm

'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useForm, FormProvider } from 'react-hook-form';
import { useProfile } from '@/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import {
  registrationCertificateSchema,
  STEP_FIELDS,
  type RegistrationCertificateInput,
} from '@/schemas/registration-certificate';
import { OperationType } from '@/types/registration-certificate';
import type { RegistrationCertificateTaxes } from '@/lib/taxes/registration-certificate';
import { useFormTracking } from '@/hooks/useFormTracking';
import { getPricingProfile } from '@/lib/process-types';

// Import des etapes
import { StepOperation } from './steps/StepOperation';
import { StepHolder } from './steps/StepHolder';
import { StepVehicle } from './steps/StepVehicle';
import { SharedStepRequester } from '@/components/processes/shared/StepRequester';
import { StepResetButton } from '@/components/processes/shared/StepResetButton';
import {
  ProfileUpdatePrompt,
  detectProfileChanges,
  REQUESTER_FIELDS,
  type FieldMapping,
} from '@/components/processes/shared/ProfileUpdatePrompt';
import { StepSummary } from './steps/StepSummary';

export type PaymentMode = 'subscription' | 'one_time';

const HOLDER_FIELDS: FieldMapping[] = [
  { profileKey: 'gender', formKey: 'holder.civility', label: 'Civilite' },
  { profileKey: 'firstName', formKey: 'holder.firstName', label: 'Prenom' },
  { profileKey: 'lastName', formKey: 'holder.lastName', label: 'Nom' },
  {
    profileKey: 'birthDate',
    formKey: 'holder.birthDate',
    label: 'Date de naissance',
    transform: (val) => (val ? new Date(val as string).toISOString().split('T')[0] : ''),
  },
  { profileKey: 'birthCityName', formKey: 'holder.birthCityName', label: 'Ville de naissance' },
];

export interface RegistrationCertificateFormProps {
  isSubscriber?: boolean;
  basePrice: number; // en centimes
  embedPartner?: string;
  pricingCode?: string;
  canceledRef?: string;
  gclid?: string;
  onComplete: (reference: string) => void;
  onCheckout: (checkoutUrl: string) => void;
}

type Step = {
  id: string;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    id: 'operation',
    title: 'Type d\'operation',
    description: 'Selectionnez le type de demarche',
  },
  {
    id: 'holder',
    title: 'Titulaire',
    description: 'Informations du titulaire de la carte grise',
  },
  {
    id: 'vehicle',
    title: 'Vehicule',
    description: 'Informations sur le vehicule',
  },
  {
    id: 'requester',
    title: 'Demandeur',
    description: 'Coordonnees et adresse de livraison',
  },
  {
    id: 'summary',
    title: 'Recapitulatif',
    description: 'Verification et validation',
  },
];

export function RegistrationCertificateForm({
  isSubscriber = false,
  basePrice: _rawBasePrice,
  embedPartner,
  pricingCode,
  canceledRef,
  gclid,
  onComplete,
  onCheckout,
}: RegistrationCertificateFormProps) {
  const { data: session } = useSession();
  const { profile, updateProfileAsync } = useProfile();
  const isEmbed = !!embedPartner;
  const pricing = getPricingProfile(pricingCode);
  const basePrice = pricing.basePrice;

  // Tracking analytics
  const tracking = useFormTracking({
    formType: 'REGISTRATION_CERT',
    partner: embedPartner || undefined,
    pricingCode: pricingCode || undefined,
    source: isEmbed ? (embedPartner === 'direct' ? 'direct' : 'embed') : 'direct',
  });

  const [currentStep, setCurrentStep] = React.useState(0);
  const [taxes, setTaxes] = React.useState<RegistrationCertificateTaxes | null>(null);
  const [isCalculatingTaxes, setIsCalculatingTaxes] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [canceledWarning, setCanceledWarning] = React.useState(false);
  const [detectedSubscriber, setDetectedSubscriber] = React.useState(false);
  const [pendingComplete, setPendingComplete] = React.useState<{ reference: string; formData: Record<string, unknown> } | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);
  const [paymentMode, _setPaymentMode] = React.useState<PaymentMode>('subscription');
  const [subscriptionConsent, _setSubscriptionConsent] = React.useState(false);
  const paymentModeRef = React.useRef(paymentMode);
  const subscriptionConsentRef = React.useRef(subscriptionConsent);
  const setPaymentMode = (mode: PaymentMode) => { paymentModeRef.current = mode; _setPaymentMode(mode); };
  const setSubscriptionConsent = (v: boolean) => { subscriptionConsentRef.current = v; _setSubscriptionConsent(v); };

  const methods = useForm<RegistrationCertificateInput>({
    resolver: zodResolver(registrationCertificateSchema),
    defaultValues: {
      operation: {
        typeId: OperationType.CHANGEMENT_TITULAIRE,
        maxAddressChange: false,
      },
      holder: {
        civility: undefined,
        lastName: '',
        firstName: '',
        birthDate: '',
        birthCityName: '',
        address: '',
        zipCode: '',
        city: '',
        departmentCode: '',
        isCompany: false,
      },
      vehicle: {
        registrationNumber: '',
        vehicleTypeId: 1,
        energyId: 4, // Essence par defaut
        fiscalPower: undefined as unknown as number,
        state: 0, // Occasion
        registrationDate: '',
      },
      requesterLastName: '',
      requesterFirstName: '',
      email: '',
      emailConfirm: '',
      telephone: '',
      deliveryAddress: {
        street: '',
        zipCode: '',
        city: '',
        country: 'FR',
      },
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

  const { handleSubmit, trigger, watch } = methods;

  // Pre-remplir depuis le profil
  React.useEffect(() => {
    if (!profile) return;
    const current = methods.getValues();
    // Titulaire
    if (!current.holder.civility && profile.gender) {
      methods.setValue('holder.civility', profile.gender === 'MALE' ? 'M' : 'MME');
    }
    if (!current.holder.firstName) methods.setValue('holder.firstName', profile.firstName || '');
    if (!current.holder.lastName) methods.setValue('holder.lastName', profile.lastName || '');
    if (profile.birthDate && !current.holder.birthDate) {
      methods.setValue('holder.birthDate', new Date(profile.birthDate).toISOString().split('T')[0]);
    }
    if (profile.birthCityName && !current.holder.birthCityName) {
      methods.setValue('holder.birthCityName', profile.birthCityName);
    }
    if (profile.address && !current.holder.address) methods.setValue('holder.address', profile.address);
    if (profile.zipCode && !current.holder.zipCode) methods.setValue('holder.zipCode', profile.zipCode);
    if (profile.city && !current.holder.city) methods.setValue('holder.city', profile.city);
    // Demandeur
    if (!current.requesterFirstName) methods.setValue('requesterFirstName', profile.firstName || '');
    if (!current.requesterLastName) methods.setValue('requesterLastName', profile.lastName || '');
    if (!current.email) methods.setValue('email', profile.email || '');
    if (!current.emailConfirm) methods.setValue('emailConfirm', profile.email || '');
    if (!current.telephone && profile.phone) methods.setValue('telephone', profile.phone);
    if (!current.deliveryAddress?.street && profile.address) methods.setValue('deliveryAddress.street', profile.address);
    if (!current.deliveryAddress?.zipCode && profile.zipCode) methods.setValue('deliveryAddress.zipCode', profile.zipCode);
    if (!current.deliveryAddress?.city && profile.city) methods.setValue('deliveryAddress.city', profile.city);
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calcul taxes en temps reel
  React.useEffect(() => {
    const calculateTaxes = async () => {
      const vehicle = methods.getValues('vehicle');
      const holder = methods.getValues('holder');

      if (vehicle?.fiscalPower && vehicle?.energyId && holder?.departmentCode) {
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
          }
        } catch {
          // Silencieux
        } finally {
          setIsCalculatingTaxes(false);
        }
      }
    };

    const timeoutId = setTimeout(calculateTaxes, 500);
    return () => clearTimeout(timeoutId);
  }, [
    watch('vehicle.fiscalPower'),
    watch('vehicle.co2'),
    watch('vehicle.energyId'),
    watch('vehicle.state'),
    watch('holder.departmentCode'),
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restaurer les donnees apres annulation de paiement
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
        // Silencieux
      }
    };
    restore();
  }, [canceledRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hash navigation pour bouton retour navigateur
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

  // Champs a valider par etape
  const stepFieldsMap: Record<string, (keyof RegistrationCertificateInput)[]> = {
    operation: ['operation'],
    holder: ['holder'],
    vehicle: ['vehicle'],
    requester: ['requesterLastName', 'requesterFirstName', 'email', 'emailConfirm', 'telephone', 'deliveryAddress'],
    summary: ['consents'],
  };

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

      // Subscriber detection a l'etape demandeur
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
            // Silencieux
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

  // Profile update check
  const completeWithProfileCheck = (reference: string, formData: Record<string, unknown>) => {
    if (!profile || isEmbed) {
      onComplete(reference);
      return;
    }
    const changes = detectProfileChanges(profile, formData, [...HOLDER_FIELDS, ...REQUESTER_FIELDS]);
    if (changes.length > 0) {
      setPendingComplete({ reference, formData });
    } else {
      onComplete(reference);
    }
  };

  const handleProfileUpdateConfirm = async () => {
    if (!pendingComplete || !profile) return;
    setIsUpdatingProfile(true);
    try {
      const changes = detectProfileChanges(profile, pendingComplete.formData, [...HOLDER_FIELDS, ...REQUESTER_FIELDS]);
      const updateData: Record<string, unknown> = {};
      for (const change of changes) {
        updateData[change.profileKey] = change.newValue;
      }
      await updateProfileAsync(updateData);
    } catch {
      // Silencieux
    } finally {
      setIsUpdatingProfile(false);
      const ref = pendingComplete.reference;
      setPendingComplete(null);
      onComplete(ref);
    }
  };

  const handleProfileUpdateSkip = () => {
    if (!pendingComplete) return;
    const ref = pendingComplete.reference;
    setPendingComplete(null);
    onComplete(ref);
  };

  const handleFormSubmit = async (data: RegistrationCertificateInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Mode embed
      if (isEmbed) {
        const response = await fetch('/api/embed/carte-grise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partner: embedPartner,
            pricingCode,
            source: isEmbed ? (embedPartner === 'direct' ? 'direct' : 'embed') : 'direct',
            paymentMode: paymentModeRef.current,
            subscriptionConsent: subscriptionConsentRef.current,
            gclid: gclid || undefined,
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
          completeWithProfileCheck(result.reference, data as unknown as Record<string, unknown>);
        }
        return;
      }

      // Mode connecte
      const isFreeProfile = pricing.paymentMode === 'free';
      const effectiveSubscriber = isSubscriber || detectedSubscriber || isFreeProfile;

      // Validation consentement abonnement
      if (!effectiveSubscriber && paymentModeRef.current === 'subscription' && !subscriptionConsentRef.current) {
        setError('Veuillez accepter les conditions de l\'abonnement pour continuer.');
        setIsSubmitting(false);
        return;
      }

      if (effectiveSubscriber) {
        // Abonne ou profil gratuit : creation directe
        const response = await fetch('/api/processes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'REGISTRATION_CERT',
            isFromSubscription: !isFreeProfile,
            isFreeProfile,
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
        completeWithProfileCheck(result.process.reference, data as unknown as Record<string, unknown>);
      } else {
        // Checkout (abonnement ou paiement unique)
        const response = await fetch('/api/processes/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'REGISTRATION_CERT',
            paymentMode: paymentModeRef.current,
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
      case 'operation':
        return <StepOperation />;
      case 'holder':
        return <StepHolder />;
      case 'vehicle':
        return <StepVehicle taxes={taxes} isCalculating={isCalculatingTaxes} />;
      case 'requester':
        return <SharedStepRequester />;
      case 'summary':
        return (
          <StepSummary
            taxes={taxes}
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
            {canceledWarning && (
              <Alert variant="warning" className="mb-6">
                Votre paiement a ete annule. Vos informations ont ete conservees. Vous pouvez reessayer quand vous le souhaitez.
              </Alert>
            )}
            {error && (
              <Alert variant="error" className="mb-6">
                {error}
              </Alert>
            )}
            {STEPS[currentStep].id !== 'summary' && (
              <StepResetButton fields={stepFieldsMap[STEPS[currentStep].id] || []} />
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
              const anyChecked = consents.acceptTerms || consents.acceptDataProcessing || consents.certifyAccuracy || consents.retractationExecution || consents.retractationRenonciation;
              if (!anyChecked) {
                const val = true as unknown as true;
                methods.setValue('consents.acceptTerms', val, { shouldValidate: true });
                methods.setValue('consents.acceptDataProcessing', val, { shouldValidate: true });
                methods.setValue('consents.certifyAccuracy', val, { shouldValidate: true });
                methods.setValue('consents.retractationExecution', val, { shouldValidate: true });
                methods.setValue('consents.retractationRenonciation', val, { shouldValidate: true });
                setPaymentMode('subscription');
                setSubscriptionConsent(true);
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
                const isFree = pricing.paymentMode === 'free';
                if (!anyChecked) {
                  return isSubscriber || detectedSubscriber || isFree
                    ? 'Tout accepter et valider'
                    : paymentMode === 'subscription'
                    ? 'Tout accepter et souscrire'
                    : 'Tout accepter et payer';
                }
                return isSubscriber || detectedSubscriber || isFree
                  ? 'Valider ma demande'
                  : paymentMode === 'subscription'
                  ? 'Souscrire et valider'
                  : 'Proceder au paiement';
              })()}
            </Button>
          )}
        </div>
      </form>

      {/* Modal mise a jour profil */}
      <ProfileUpdatePrompt
        isOpen={!!pendingComplete}
        changes={pendingComplete ? detectProfileChanges(profile, pendingComplete.formData, [...HOLDER_FIELDS, ...REQUESTER_FIELDS]) : []}
        onConfirm={handleProfileUpdateConfirm}
        onSkip={handleProfileUpdateSkip}
        isUpdating={isUpdatingProfile}
      />
    </FormProvider>
  );
}

export default RegistrationCertificateForm;
