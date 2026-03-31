// Etape 6: Recapitulatif et validation

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  genderLabels,
  requestMotifLabels,
  nationalityReasonLabels,
  FRANCE_COUNTRY_ID,
  calculateStampTax,
  type RequestMotifValue,
  type NationalityReasonValue,
} from '@/types/identity-card';
import { formatPrice } from '@/lib/process-types';
import type { IdentityCardInput } from '@/schemas/identity-card';

export type PaymentMode = 'subscription' | 'one_time';

const SUBSCRIPTION_MONTHLY_PRICE = 990; // 9,90 EUR en centimes

interface StepSummaryProps {
  isSubscriber: boolean;
  basePrice: number;
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
  const { watch, setValue, formState: { errors } } = useFormContext<IdentityCardInput>();
  const formData = watch();

  const stampTax = calculateStampTax(formData.motif, formData.deliveryAddress?.zipCode);
  const totalBasePrice = basePrice + stampTax;
  const savings = totalBasePrice - SUBSCRIPTION_MONTHLY_PRICE;

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
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Recapitulatif de votre demande
        </h2>
        <p className="form-gov-hint">
          Verifiez les informations avant de valider
        </p>
      </div>

      {/* Recapitulatif */}
      <div className="space-y-3">
        <SummaryCard title="Motif de la demande">
          <p className="text-base font-medium">{requestMotifLabels[formData.motif as RequestMotifValue] || formData.motif}</p>
        </SummaryCard>

        <SummaryCard title="Titulaire">
          <p className="text-base font-medium">
            {genderLabels[formData.gender]} {formData.prenom} {formData.nom}
          </p>
          <p className="form-gov-hint">
            Ne(e) le {formatDate(formData.birthDate)} a {formData.birthCityName}
            {formData.birthCountryId === FRANCE_COUNTRY_ID ? '' : ' (etranger)'}
          </p>
          <p className="form-gov-hint">Taille : {formData.taille} cm</p>
        </SummaryCard>

        <SummaryCard title="Nationalite">
          <p className="text-base">
            {nationalityReasonLabels[formData.raisonFrancais as NationalityReasonValue] || formData.raisonFrancais}
          </p>
        </SummaryCard>

        <SummaryCard title="Filiation">
          <p className="text-base">
            Pere : {formData.fatherUnknown ? <span className="italic text-gray-400">Inconnu</span> : `${formData.fatherFirstName} ${formData.fatherLastName}`}
          </p>
          <p className="text-base">
            Mere : {formData.motherUnknown ? <span className="italic text-gray-400">Inconnue</span> : `${formData.motherFirstName} ${formData.motherLastName}`}
          </p>
        </SummaryCard>

        <SummaryCard title="Coordonnees">
          <p className="text-base">{formData.email}</p>
          <p className="text-base">{formData.telephone}</p>
        </SummaryCard>

        <SummaryCard title="Adresse de livraison">
          <p className="text-base">
            {formData.deliveryAddress?.street}, {formData.deliveryAddress?.zipCode} {formData.deliveryAddress?.city}
          </p>
        </SummaryCard>
      </div>

      {/* Timbre fiscal */}
      {stampTax > 0 && (
        <div className="p-4 bg-amber-50 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-center">
            <span className="text-base text-amber-900 font-semibold">Timbre fiscal</span>
            <span className="text-base font-bold text-amber-900">{formatPrice(stampTax)}</span>
          </div>
          <p className="form-gov-hint mt-1">
            Obligatoire pour les demandes suite a un vol ou une perte.
          </p>
        </div>
      )}

      {/* Choix formule - non-abonnes */}
      {!isSubscriber && (
        <div>
          <h3 className="form-gov-section-title">Formule de traitement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onPaymentModeChange('subscription')}
              className={`
                text-left border-l-4 p-4 transition-all
                ${paymentMode === 'subscription'
                  ? 'border-l-blue-700 bg-blue-50'
                  : 'border-l-transparent bg-gray-50 hover:bg-blue-50/50'
                }
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <RadioDot selected={paymentMode === 'subscription'} />
                  <span className="font-semibold text-base text-gray-900">Abonnement</span>
                </div>
                <span className="text-xs font-semibold bg-blue-700 text-white px-2 py-0.5">
                  Recommande
                </span>
              </div>
              <p className="text-xl font-bold text-gray-900 ml-7">
                9,90 EUR<span className="text-base font-normal text-gray-500">/mois</span>
              </p>
              <p className="form-gov-hint ml-7 mt-0.5">
                Demarche incluse{stampTax > 0 ? ` + timbre fiscal ${formatPrice(stampTax)}` : ''} - Sans engagement
              </p>
              {savings > 0 && (
                <p className="text-sm font-semibold text-green-700 ml-7 mt-1">
                  Economie de {formatPrice(savings)}
                </p>
              )}
            </button>

            <button
              type="button"
              onClick={() => onPaymentModeChange('one_time')}
              className={`
                text-left border-l-4 p-4 transition-all
                ${paymentMode === 'one_time'
                  ? 'border-l-blue-700 bg-blue-50'
                  : 'border-l-transparent bg-gray-50 hover:bg-blue-50/50'
                }
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <RadioDot selected={paymentMode === 'one_time'} />
                <span className="font-semibold text-base text-gray-900">Paiement unique</span>
              </div>
              <p className="text-xl font-bold text-gray-900 ml-7">{formatPrice(totalBasePrice)}</p>
              <p className="form-gov-hint ml-7 mt-0.5">Cette demarche uniquement</p>
            </button>
          </div>
        </div>
      )}

      {/* Total */}
      <div className="bg-gray-50 px-5 py-4 flex justify-between items-center border-l-4 border-l-blue-700">
        <span className="font-semibold text-base text-gray-900">Total a payer</span>
        <div className="text-right">
          <span className="text-xl font-bold text-blue-700">
            {isSubscriber ? (
              stampTax > 0 ? formatPrice(stampTax) : <span className="text-green-700">Inclus</span>
            ) : paymentMode === 'subscription' ? (
              formatPrice(SUBSCRIPTION_MONTHLY_PRICE + stampTax)
            ) : (
              formatPrice(totalBasePrice)
            )}
          </span>
          {!isSubscriber && paymentMode === 'subscription' && (
            <span className="block text-sm text-green-700 font-semibold">
              au lieu de {formatPrice(totalBasePrice)}
            </span>
          )}
          {isSubscriber && stampTax === 0 && (
            <span className="block text-sm text-green-700 font-semibold">
              Economie de {formatPrice(basePrice)}
            </span>
          )}
        </div>
      </div>

      {/* Consentements */}
      <div className="space-y-3">
        <div className={`form-gov-checkbox-group ${allConsentsAccepted ? 'checked' : ''}`}>
          <input
            type="checkbox"
            id="allConsents"
            checked={!!allConsentsAccepted}
            onChange={(e) => handleAllConsents(e.target.checked)}
          />
          <label htmlFor="allConsents">
            J'accepte les{' '}
            <a href="/conditions-generales" target="_blank" className="text-blue-700 underline">
              conditions generales de vente
            </a>
            , la{' '}
            <a href="/politique-confidentialite" target="_blank" className="text-blue-700 underline">
              politique de confidentialite
            </a>
            {' '}et le traitement de mes donnees (RGPD). Je certifie l'exactitude des informations fournies. *
          </label>
        </div>
        {(errors.consents?.acceptTerms || errors.consents?.acceptDataProcessing || errors.consents?.certifyAccuracy) && (
          <p className="form-gov-error-msg">Vous devez accepter les conditions pour continuer.</p>
        )}

        {!isSubscriber && paymentMode === 'subscription' && (
          <div className={`form-gov-checkbox-group ${subscriptionConsent ? 'checked' : ''}`}>
            <input
              type="checkbox"
              id="subscriptionConsent"
              checked={subscriptionConsent}
              onChange={(e) => onSubscriptionConsentChange(e.target.checked)}
            />
            <label htmlFor="subscriptionConsent">
              Je souscris à l'abonnement mensuel Assistance Administrative ({formatPrice(SUBSCRIPTION_MONTHLY_PRICE)}/mois),
              resiliable a tout moment depuis mon espace membre, sans frais. *
            </label>
          </div>
        )}
      </div>

      {/* Delai */}
      <p className="form-gov-hint">
        Traitement sous 10 a 15 jours ouvres apres validation. Un recepisse de demande vous sera envoye par email.
      </p>
    </div>
  );
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div className={`
      w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
      ${selected ? 'border-blue-700' : 'border-gray-400'}
    `}>
      {selected && <div className="w-2.5 h-2.5 rounded-full bg-blue-700" />}
    </div>
  );
}

function SummaryCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border-l-4 border-l-gray-300 p-4">
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">{title}</h4>
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
