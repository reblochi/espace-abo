// Etape 5: Recapitulatif et validation

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import {
  recordTypeLabels,
  claimerTypeLabels,
  genderLabels,
  RecordType,
  FRANCE_COUNTRY_ID,
} from '@/types/birth-certificate';
import { formatPrice } from '@/lib/process-types';
import type { BirthCertificateInput } from '@/schemas/birth-certificate';

export type PaymentMode = 'subscription' | 'one_time';

const SUBSCRIPTION_MONTHLY_PRICE = 990; // 9,90 EUR en centimes

interface StepSummaryProps {
  isSubscriber: boolean;
  basePrice: number; // en centimes
  paymentMode: PaymentMode;
  onPaymentModeChange: (mode: PaymentMode) => void;
  subscriptionConsent: boolean;
  onSubscriptionConsentChange: (checked: boolean) => void;
}

export function StepSummary({
  isSubscriber,
  basePrice,
  paymentMode,
  onPaymentModeChange,
  subscriptionConsent,
  onSubscriptionConsentChange,
}: StepSummaryProps) {
  const { watch, setValue, formState: { errors } } = useFormContext<BirthCertificateInput>();
  const formData = watch();

  const showParents = formData.recordType === RecordType.COPIE_INTEGRALE
    || formData.recordType === RecordType.EXTRAIT_FILIATION;

  const savings = basePrice - SUBSCRIPTION_MONTHLY_PRICE;

  const allConsentsAccepted = watch('consents.acceptTerms')
    && watch('consents.acceptDataProcessing')
    && watch('consents.certifyAccuracy');

  const handleAllConsents = (checked: boolean) => {
    const val = checked as unknown as true;
    setValue('consents.acceptTerms', val, { shouldValidate: true });
    setValue('consents.acceptDataProcessing', val, { shouldValidate: true });
    setValue('consents.certifyAccuracy', val, { shouldValidate: true });
  };

  return (
    <div className="space-y-5">
      {/* Recapitulatif */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <SummaryCard title="Type d'acte">
          <p className="font-medium">{recordTypeLabels[formData.recordType]}</p>
          <p className="text-sm text-gray-500">{formData.recordCount} copie(s)</p>
        </SummaryCard>

        <SummaryCard title="Beneficiaire">
          <p className="font-medium">
            {genderLabels[formData.gender]} {formData.firstName} {formData.lastName}
          </p>
          <p className="text-sm text-gray-500">
            Ne(e) le {formatDate(formData.birthDate)} a {formData.birthCityName}
            {formData.birthCountryId === FRANCE_COUNTRY_ID ? '' : ' (etranger)'}
          </p>
        </SummaryCard>

        <SummaryCard title="Lien avec le beneficiaire">
          <p className="font-medium">{claimerTypeLabels[formData.claimerType]}</p>
        </SummaryCard>

        {showParents && (
          <SummaryCard title="Filiation">
            <p className="text-sm">
              Pere : {formData.fatherUnknown ? <span className="italic text-gray-400">Inconnu</span> : `${formData.fatherFirstName} ${formData.fatherLastName}`}
            </p>
            <p className="text-sm">
              Mere : {formData.motherUnknown ? <span className="italic text-gray-400">Inconnue</span> : `${formData.motherFirstName} ${formData.motherLastName}`}
            </p>
          </SummaryCard>
        )}

        <SummaryCard title="Adresse de livraison" className={showParents ? '' : 'lg:col-span-2'}>
          <p className="text-sm">
            {formData.deliveryAddress.street}, {formData.deliveryAddress.zipCode} {formData.deliveryAddress.city}
          </p>
        </SummaryCard>
      </div>

      {/* Choix formule - non-abonnes */}
      {!isSubscriber && (
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Formule de traitement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Abonnement */}
            <button
              type="button"
              onClick={() => onPaymentModeChange('subscription')}
              className={cn(
                'text-left rounded-lg border-2 p-4 transition-all',
                paymentMode === 'subscription'
                  ? 'border-blue-600 bg-blue-50/40'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <RadioDot selected={paymentMode === 'subscription'} />
                  <span className="font-medium text-gray-900">Abonnement</span>
                </div>
                <span className="text-xs font-medium bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                  Recommande
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 ml-7">
                9,90 EUR<span className="text-sm font-normal text-gray-500">/mois</span>
              </p>
              <p className="text-xs text-gray-500 ml-7 mt-0.5">Demarche incluse - Sans engagement</p>
              {savings > 0 && (
                <p className="text-xs font-medium text-green-700 ml-7 mt-1">
                  Economie de {formatPrice(savings)}
                </p>
              )}
            </button>

            {/* Paiement unique */}
            <button
              type="button"
              onClick={() => onPaymentModeChange('one_time')}
              className={cn(
                'text-left rounded-lg border-2 p-4 transition-all',
                paymentMode === 'one_time'
                  ? 'border-blue-600 bg-blue-50/40'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <RadioDot selected={paymentMode === 'one_time'} />
                <span className="font-medium text-gray-900">Paiement unique</span>
              </div>
              <p className="text-xl font-bold text-gray-900 ml-7">{formatPrice(basePrice)}</p>
              <p className="text-xs text-gray-500 ml-7 mt-0.5">Cette demarche uniquement</p>
            </button>
          </div>
        </div>
      )}

      {/* Total */}
      <div className="bg-gray-50 rounded-lg px-5 py-3 flex justify-between items-center">
        <span className="font-medium text-gray-900">Total a payer</span>
        <div className="text-right">
          <span className="text-lg font-bold text-blue-600">
            {isSubscriber ? (
              <span className="text-green-600">Inclus</span>
            ) : paymentMode === 'subscription' ? (
              formatPrice(SUBSCRIPTION_MONTHLY_PRICE)
            ) : (
              formatPrice(basePrice)
            )}
          </span>
          {!isSubscriber && paymentMode === 'subscription' && (
            <span className="block text-xs text-green-600">
              au lieu de {formatPrice(basePrice)}
            </span>
          )}
          {isSubscriber && (
            <span className="block text-xs text-green-600">
              Economie de {formatPrice(basePrice)}
            </span>
          )}
        </div>
      </div>

      {/* Validation */}
      <div className="space-y-3">
        {/* Consentement global */}
        <label className={cn(
          'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
          allConsentsAccepted
            ? 'border-blue-200 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        )}>
          <input
            type="checkbox"
            checked={!!allConsentsAccepted}
            onChange={(e) => handleAllConsents(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-sm text-gray-700">
            J'accepte les{' '}
            <a href="/conditions-generales" target="_blank" className="text-blue-600 underline">
              conditions generales de vente
            </a>
            , la{' '}
            <a href="/politique-confidentialite" target="_blank" className="text-blue-600 underline">
              politique de confidentialite
            </a>
            {' '}et le traitement de mes donnees (RGPD). Je certifie l'exactitude des informations fournies. *
          </span>
        </label>
        {(errors.consents?.acceptTerms || errors.consents?.acceptDataProcessing || errors.consents?.certifyAccuracy) && (
          <p className="text-sm text-red-600">Vous devez accepter les conditions pour continuer.</p>
        )}

        {/* Consentement abonnement */}
        {!isSubscriber && paymentMode === 'subscription' && (
          <label className={cn(
            'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
            subscriptionConsent
              ? 'border-blue-200 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          )}>
            <input
              type="checkbox"
              checked={subscriptionConsent}
              onChange={(e) => onSubscriptionConsentChange(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm text-gray-700">
              Je souscris a l'abonnement mensuel Assistance Administrative ({formatPrice(SUBSCRIPTION_MONTHLY_PRICE)}/mois),
              resiliable a tout moment depuis mon espace membre, sans frais. *
            </span>
          </label>
        )}
      </div>

      {/* Delai */}
      <p className="text-xs text-gray-500">
        Traitement sous 3 a 5 jours ouvres apres validation. Envoi par courrier a l'adresse indiquee.
      </p>
    </div>
  );
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div className={cn(
      'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
      selected ? 'border-blue-600' : 'border-gray-300'
    )}>
      {selected && <div className="w-2 h-2 rounded-full bg-blue-600" />}
    </div>
  );
}

function SummaryCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('bg-white rounded-lg border p-3', className)}>
      <h4 className="text-xs font-medium text-gray-500 mb-1">{title}</h4>
      {children}
    </div>
  );
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export default StepSummary;
