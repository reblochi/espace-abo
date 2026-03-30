// Formulaire complet pour demande de carte d'identite

'use client';

import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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

  const { handleSubmit, trigger, getValues, setError: setFieldError, formState: { errors: formErrors } } = methods;

  // Validation de l'etape courante (champs individuels + validations cross-champs)
  const validateCurrentStep = async (): Promise<boolean> => {
    const stepId = STEPS[currentStep]?.id;
    const fieldsToValidate = STEP_FIELDS[stepId];
    if (!fieldsToValidate || fieldsToValidate.length === 0) return true;

    const fieldsValid = await trigger(fieldsToValidate);
    if (!fieldsValid) return false;

    // Validations cross-champs par etape
    const values = getValues();

    if (stepId === 'parents') {
      let valid = true;

      // Les deux parents ne peuvent pas etre inconnus
      if (values.fatherUnknown && values.motherUnknown) {
        setFieldError('fatherUnknown', { type: 'manual', message: 'Les deux parents ne peuvent pas etre inconnus simultanement' });
        valid = false;
      }

      // Pere non inconnu : nom, prenom, ville requis
      if (!values.fatherUnknown) {
        if (!values.fatherLastName?.trim()) {
          setFieldError('fatherLastName', { type: 'manual', message: 'Nom du pere requis' });
          valid = false;
        }
        if (!values.fatherFirstName?.trim()) {
          setFieldError('fatherFirstName', { type: 'manual', message: 'Prenom du pere requis' });
          valid = false;
        }
        if (!values.fatherBirthCity?.trim()) {
          setFieldError('fatherBirthCity', { type: 'manual', message: 'Ville de naissance du pere requise' });
          valid = false;
        }
      }

      // Mere non inconnue : nom, prenom, ville requis
      if (!values.motherUnknown) {
        if (!values.motherLastName?.trim()) {
          setFieldError('motherLastName', { type: 'manual', message: 'Nom de la mere requis' });
          valid = false;
        }
        if (!values.motherFirstName?.trim()) {
          setFieldError('motherFirstName', { type: 'manual', message: 'Prenom de la mere requis' });
          valid = false;
        }
        if (!values.motherBirthCity?.trim()) {
          setFieldError('motherBirthCity', { type: 'manual', message: 'Ville de naissance de la mere requise' });
          valid = false;
        }
      }

      // Date naissance pere < date naissance titulaire
      if (!values.fatherUnknown && values.fatherBirthDate && values.birthDate) {
        if (new Date(values.fatherBirthDate) >= new Date(values.birthDate)) {
          setFieldError('fatherBirthDate', { type: 'manual', message: 'La date de naissance du pere doit etre anterieure a celle du titulaire' });
          valid = false;
        }
      }

      // Date naissance mere < date naissance titulaire
      if (!values.motherUnknown && values.motherBirthDate && values.birthDate) {
        if (new Date(values.motherBirthDate) >= new Date(values.birthDate)) {
          setFieldError('motherBirthDate', { type: 'manual', message: 'La date de naissance de la mere doit etre anterieure a celle du titulaire' });
          valid = false;
        }
      }

      return valid;
    }

    if (stepId === 'requester') {
      let valid = true;

      // Confirmation email doit correspondre
      if (values.email !== values.emailConfirm) {
        setFieldError('emailConfirm', { type: 'manual', message: 'Les 2 adresses email ne sont pas identiques' });
        valid = false;
      }

      // Telephone francais : 10 chiffres commencant par 0
      const tel = values.telephone?.replace(/[\s\-.]/g, '') || '';
      if (!/^0[0-9]{9}$/.test(tel)) {
        setFieldError('telephone', { type: 'manual', message: 'Format invalide (exemple : 06 12 34 56 78)' });
        valid = false;
      }

      return valid;
    }

    if (stepId === 'identity') {
      let valid = true;

      // Si nom d'usage rempli, type obligatoire
      if (values.nomUsage && values.nomUsage.trim().length > 0 && !values.typeNomUsage) {
        setFieldError('typeNomUsage', { type: 'manual', message: 'Veuillez preciser le type de nom d\'usage' });
        valid = false;
      }

      return valid;
    }

    return true;
  };

  const handleNext = async () => {
    setError(null);
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < STEPS.length - 1) {
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

  // Progress bar percentage
  const progress = STEPS.length > 1 ? (currentStep / (STEPS.length - 1)) * 100 : 0;

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
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Demande de Carte d'Identite
          </h1>
        </div>

        {/* Progress bar - GOV.UK style */}
        <div className="form-gov-progress">
          <div className="form-gov-progress-header">
            <p className="form-gov-progress-text">
              <span className="form-gov-progress-step">
                Etape {currentStep + 1} sur {STEPS.length}
              </span>
              <span className="form-gov-progress-label">
                — {STEPS[currentStep].title}
              </span>
            </p>
          </div>
          <div className="form-gov-progress-bar">
            <div
              className="form-gov-progress-fill"
              style={{ width: `${Math.max(progress, 2)}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="form-gov-card">
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
          }}>
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-l-red-600 mb-6">
                <p className="text-base text-red-800 font-semibold">{error}</p>
              </div>
            )}

            {renderStepContent()}

            {/* Navigation */}
            <div className={`flex ${currentStep === 0 ? 'justify-end' : 'justify-between'} mt-8 pt-6 border-t border-gray-200`}>
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="btn-gov btn-gov-secondary"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Retour
                </button>
              )}

              {currentStep < STEPS.length - 1 ? (
                <button type="button" onClick={handleNext} className="btn-gov btn-gov-primary">
                  Continuer
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting} className="btn-gov btn-gov-primary">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Traitement...
                    </>
                  ) : isSubscriber ? (
                    <>
                      Valider ma demande
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  ) : paymentMode === 'subscription' ? (
                    <>
                      Souscrire et valider
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      Proceder au paiement
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 form-gov-hint">
          Vos donnees sont traitees de maniere securisee et confidentielle.
        </p>
      </div>
    </FormProvider>
  );
}

export default IdentityCardForm;
