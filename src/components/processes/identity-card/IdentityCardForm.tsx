// Formulaire complet pour demande de carte d'identité

'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useForm, FormProvider } from 'react-hook-form';
import { useProfile } from '@/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  identityCardSchema,
  STEP_FIELDS,
  type IdentityCardInput,
} from '@/schemas/identity-card';
import { FRANCE_COUNTRY_ID, calculateStampTax } from '@/types/identity-card';
import { useFormTracking } from '@/hooks/useFormTracking';

// Import des etapes
import { getPricingProfile } from '@/lib/process-types';
import { StepRequestType } from './steps/StepRequestType';
import { StepIdentity } from './steps/StepIdentity';
import { StepBirth } from './steps/StepBirth';
import { StepParents } from './steps/StepParents';
import { StepRequester } from './steps/StepRequester';
import { StepContact } from './steps/StepContact';
import { StepSummary, type PaymentMode } from './steps/StepSummary';
import { StepResetButton } from '@/components/processes/shared/StepResetButton';
import {
  ProfileUpdatePrompt,
  detectProfileChanges,
  IDENTITY_BENEFICIARY_FIELDS,
  REQUESTER_FIELDS,
} from '@/components/processes/shared/ProfileUpdatePrompt';

export interface IdentityCardFormProps {
  isSubscriber?: boolean;
  basePrice: number; // en centimes
  embedPartner?: string; // Si defini, mode embed sans auth
  pricingCode?: string; // Code profil pricing (AB testing)
  canceledRef?: string; // Reference d'une demarche dont le paiement a ete annule
  gclid?: string; // Google Click ID pour le suivi conversions
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
    title: 'Titulaire',
    description: 'Identite du titulaire de la carte',
  },
  {
    id: 'birth',
    title: 'Naissance',
    description: 'Date et lieu de naissance, nationalite',
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
  basePrice: rawBasePrice,
  embedPartner,
  pricingCode,
  canceledRef,
  gclid,
  onComplete,
  onCheckout,
}: IdentityCardFormProps) {
  const { data: session } = useSession();
  const { profile, updateProfileAsync } = useProfile();
  const isEmbed = !!embedPartner;
  const isDirectAccess = embedPartner === 'direct'; // Acces direct sans auth (pas un embed externe)
  const pricing = getPricingProfile(pricingCode);
  const basePrice = pricing.basePrice;

  const STEPS = React.useMemo(() => {
    const steps = [...BASE_STEPS];
    if (isEmbed && !isDirectAccess) steps.push(CONTACT_STEP); // Contact step seulement pour les vrais embeds externes
    steps.push(SUMMARY_STEP);
    return steps;
  }, [isEmbed, isDirectAccess]);

  // Tracking analytics
  const tracking = useFormTracking({
    formType: 'IDENTITY_CARD',
    partner: embedPartner || undefined,
    pricingCode: pricingCode || undefined,
    source: isEmbed ? (isDirectAccess ? 'direct' : 'embed') : 'direct',
  });

  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [canceledWarning, setCanceledWarning] = React.useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = React.useState(false);
  const [detectedSubscriber, setDetectedSubscriber] = React.useState(false);
  const [pendingComplete, setPendingComplete] = React.useState<{ reference: string; formData: Record<string, unknown> } | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = React.useState(false);
  const [paymentMode, _setPaymentMode] = React.useState<PaymentMode>('one_time');
  const [subscriptionConsent, _setSubscriptionConsent] = React.useState(false);
  const paymentModeRef = React.useRef(paymentMode);
  const subscriptionConsentRef = React.useRef(subscriptionConsent);
  const setPaymentMode = (mode: PaymentMode) => { paymentModeRef.current = mode; _setPaymentMode(mode); };
  const setSubscriptionConsent = (v: boolean) => { subscriptionConsentRef.current = v; _setSubscriptionConsent(v); };

  const methods = useForm<IdentityCardInput>({
    resolver: zodResolver(identityCardSchema),
    defaultValues: {
      motif: undefined,
      case2004: false,
      reception: 'Mail' as const,
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
      taille: 175,
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
      contact: (isEmbed && !isDirectAccess) ? {
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
      } : undefined,
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

  const { handleSubmit, trigger, getValues, setError: setFieldError, formState: { errors: formErrors } } = methods;

  // Pre-remplir les infos depuis le profil
  React.useEffect(() => {
    if (!profile) return;
    const current = methods.getValues();
    if (!current.gender && profile.gender) methods.setValue('gender', profile.gender as 'MALE' | 'FEMALE');
    if (!current.nom) methods.setValue('nom', profile.lastName || '');
    if (!current.prenom) methods.setValue('prenom', profile.firstName || '');
    if (!current.email) methods.setValue('email', profile.email || '');
    if (!current.emailConfirm) methods.setValue('emailConfirm', profile.email || '');
    if (!current.telephone && profile.phone) methods.setValue('telephone', profile.phone);
    if (!current.deliveryAddress?.street && profile.address) methods.setValue('deliveryAddress.street', profile.address);
    if (!current.deliveryAddress?.zipCode && profile.zipCode) methods.setValue('deliveryAddress.zipCode', profile.zipCode);
    if (!current.deliveryAddress?.city && profile.city) methods.setValue('deliveryAddress.city', profile.city);
    // Naissance
    if (profile.birthDate && !current.birthDate) {
      methods.setValue('birthDate', new Date(profile.birthDate).toISOString().split('T')[0]);
    }
    if (profile.birthCountryId && !current.birthCountryId) {
      methods.setValue('birthCountryId', profile.birthCountryId);
    }
    if (profile.birthCityId && !current.birthCityId) {
      methods.setValue('birthCityId', profile.birthCityId);
    }
    if (profile.birthCityName && !current.birthCityName) {
      methods.setValue('birthCityName', profile.birthCityName);
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

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

      // Pere non inconnu : nom, prenom, date naissance, ville requis
      if (!values.fatherUnknown) {
        if (!values.fatherLastName?.trim()) {
          setFieldError('fatherLastName', { type: 'manual', message: 'Nom du pere requis' });
          valid = false;
        }
        if (!values.fatherFirstName?.trim()) {
          setFieldError('fatherFirstName', { type: 'manual', message: 'Prénom du père requis' });
          valid = false;
        }
        if (!values.fatherBirthDate || values.fatherBirthDate.length < 10 || values.fatherBirthDate.includes('0000') || values.fatherBirthDate.includes('-00')) {
          setFieldError('fatherBirthDate', { type: 'manual', message: 'Date de naissance du pere requise' });
          valid = false;
        }
        if (!values.fatherBirthCity?.trim()) {
          setFieldError('fatherBirthCity', { type: 'manual', message: 'Ville de naissance du pere requise' });
          valid = false;
        }
      }

      // Mere non inconnue : nom, prenom, date naissance, ville requis
      if (!values.motherUnknown) {
        if (!values.motherLastName?.trim()) {
          setFieldError('motherLastName', { type: 'manual', message: 'Nom de la mere requis' });
          valid = false;
        }
        if (!values.motherFirstName?.trim()) {
          setFieldError('motherFirstName', { type: 'manual', message: 'Prénom de la mère requis' });
          valid = false;
        }
        if (!values.motherBirthDate || values.motherBirthDate.length < 10 || values.motherBirthDate.includes('0000') || values.motherBirthDate.includes('-00')) {
          setFieldError('motherBirthDate', { type: 'manual', message: 'Date de naissance de la mere requise' });
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

    if (stepId === 'requestType') {
      // Si motif expiration (16), case2004 doit etre cochee
      if (values.motif === '16' && !values.case2004) {
        setFieldError('case2004', { type: 'manual', message: 'Vous devez confirmer avoir pris connaissance de cette information' });
        return false;
      }
      return true;
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

  // Track step changes + hash pour bouton retour navigateur
  // Note: on utilise le hash (#step-N) au lieu de pushState car Next.js App Router
  // intercepte pushState et declenche des fetches RSC en boucle
  React.useEffect(() => {
    tracking.trackStepEntered(currentStep, STEPS[currentStep]?.id || 'unknown');
    // Mettre a jour le hash pour chaque etape (sauf la premiere)
    if (currentStep > 0) {
      const hash = `#step-${currentStep}`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    } else if (window.location.hash) {
      // Retour a l'etape 0 : supprimer le hash
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

  // Scroll en haut — fonctionne en page directe ET en iframe
  const scrollFormTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Si dans une iframe, demander au parent de scroller l'iframe en vue
    if (window.parent !== window) {
      window.parent.postMessage({ source: 'advercity-widget', type: 'scrollTop' }, '*');
    }
  };

  const handleNext = async () => {
    setError(null);
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < STEPS.length - 1) {
      tracking.trackStepCompleted(currentStep, STEPS[currentStep].id);

      // Verifier si l'email ou telephone correspond a un abonne
      // au moment de quitter l'etape requester ou contact
      const stepId = STEPS[currentStep].id;
      if (stepId === 'requester' || stepId === 'contact') {
        const values = getValues();
        const emailToCheck = stepId === 'contact' ? values.contact?.email : values.email;
        const phoneToCheck = stepId === 'requester' ? values.telephone : values.contact?.phone;
        if (emailToCheck || phoneToCheck) {
          try {
            const res = await fetch('/api/embed/check-subscriber', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: emailToCheck, phone: phoneToCheck }),
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
      // Si on revient sur l'etape requester ou contact, re-verifier l'abonnement au prochain "Continuer"
      const targetStepId = STEPS[currentStep - 1]?.id;
      if (targetStepId === 'requester' || targetStepId === 'contact') {
        setDetectedSubscriber(false);
      }
      setCurrentStep(currentStep - 1);
      scrollFormTop();
    }
  };

  const completeWithProfileCheck = (reference: string, formData: Record<string, unknown>) => {
    if (!profile || isEmbed) {
      onComplete(reference);
      return;
    }
    const changes = detectProfileChanges(profile, formData, [...IDENTITY_BENEFICIARY_FIELDS, ...REQUESTER_FIELDS]);
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
      const changes = detectProfileChanges(profile, pendingComplete.formData, [...IDENTITY_BENEFICIARY_FIELDS, ...REQUESTER_FIELDS]);
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

  const handleFormSubmit = async (data: IdentityCardInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const stampTax = calculateStampTax(data.motif, data.deliveryAddress?.zipCode);

      // Mode embed ou acces direct sans auth: endpoint public
      if (isEmbed) {
        // En acces direct, construire le contact depuis les champs du formulaire
        const submitData = isDirectAccess
          ? {
              ...data,
              contact: {
                email: data.email,
                firstName: data.isTitulaire ? data.prenom : data.requesterFirstName,
                lastName: data.isTitulaire ? data.nom : data.requesterLastName,
                phone: data.telephone,
              },
            }
          : data;

        const response = await fetch('/api/embed/carte-identite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partner: embedPartner,
            pricingCode,
            paymentMode: paymentModeRef.current,
            subscriptionConsent: subscriptionConsentRef.current,
            gclid: gclid || undefined,
            data: submitData,
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

      // Mode connecte standard

      const isFreeProfile = pricing.paymentMode === 'free';
      const effectiveSubscriber = isSubscriber || detectedSubscriber || isFreeProfile;
      if (effectiveSubscriber && stampTax === 0) {
        // Abonne/gratuit sans timbre fiscal : creation directe
        const response = await fetch('/api/processes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'IDENTITY_CARD',
            isFromSubscription: !isFreeProfile,
            isFreeProfile,
            stampTaxCents: 0,
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

        tracking.trackFormCompleted();
        completeWithProfileCheck(result.process.reference, data as unknown as Record<string, unknown>);
      } else if (effectiveSubscriber && stampTax > 0) {
        // Abonne/gratuit avec timbre fiscal : passer par checkout pour payer le timbre
        const response = await fetch('/api/processes/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'IDENTITY_CARD',
            paymentMode: 'one_time',
            isFromSubscription: !isFreeProfile,
            isFreeProfile,
            stampTaxCents: stampTax,
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
      } else {
        const response = await fetch('/api/processes/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'IDENTITY_CARD',
            paymentMode: paymentModeRef.current,
            stampTaxCents: stampTax,
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
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Progress bar percentage
  const progress = STEPS.length > 1 ? (currentStep / (STEPS.length - 1)) * 100 : 0;

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'requestType':
        return <StepRequestType onSelect={handleNext} />;
      case 'identity':
        return <StepIdentity />;
      case 'birth':
        return <StepBirth />;
      case 'parents':
        return <StepParents />;
      case 'requester':
        return <StepRequester />;
      case 'contact':
        return <StepContact />;
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
          <form onSubmit={(e) => e.preventDefault()}>
            {canceledWarning && (
              <div className="p-4 bg-yellow-50 border-l-4 border-l-yellow-500 mb-6">
                <p className="text-base text-yellow-800 font-semibold">Votre paiement a ete annule. Vos informations ont ete conservees. Vous pouvez reessayer quand vous le souhaitez.</p>
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-l-red-600 mb-6">
                <p className="text-base text-red-800 font-semibold">{error}</p>
              </div>
            )}

            {STEPS[currentStep].id !== 'summary' && (
              <StepResetButton fields={STEP_FIELDS[STEPS[currentStep].id] || []} />
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
                <button type="button" disabled={isSubmitting} onClick={() => {
                  // Si aucune case cochee, tout cocher d'abord
                  const consents = methods.getValues('consents');
                  const anyChecked = consents?.acceptTerms || consents?.acceptDataProcessing || consents?.retractationExecution;
                  if (!anyChecked) {
                    const val = true as unknown as true;
                    methods.setValue('consents.acceptTerms', val);
                    methods.setValue('consents.acceptDataProcessing', val);
                    methods.setValue('consents.certifyAccuracy', val);
                    methods.setValue('consents.retractationExecution', val);
                    methods.setValue('consents.retractationRenonciation', val);
                    setPaymentMode('subscription');
                    setSubscriptionConsent(true);
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
                  })();
                }} className="btn-gov btn-gov-primary">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Traitement...
                    </>
                  ) : (() => {
                    const c = methods.watch('consents');
                    const anyChecked = c?.acceptTerms || c?.acceptDataProcessing || c?.retractationExecution;
                    const effectiveSub = isSubscriber || detectedSubscriber || pricing.paymentMode === 'free';
                    if (!anyChecked) {
                      return <>Tout accepter et {effectiveSub ? 'valider' : paymentMode === 'subscription' ? 'souscrire' : 'payer'}</>;
                    }
                    if (effectiveSub) {
                      return <>Valider ma demande <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></>;
                    }
                    if (paymentMode === 'subscription') {
                      return <>Souscrire et valider <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></>;
                    }
                    return <>Proceder au paiement <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></>;
                  })()}
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

      <ProfileUpdatePrompt
        isOpen={!!pendingComplete}
        changes={pendingComplete ? detectProfileChanges(profile, pendingComplete.formData, [...IDENTITY_BENEFICIARY_FIELDS, ...REQUESTER_FIELDS]) : []}
        onConfirm={handleProfileUpdateConfirm}
        onSkip={handleProfileUpdateSkip}
        isUpdating={isUpdatingProfile}
      />
    </FormProvider>
  );
}

export default IdentityCardForm;
