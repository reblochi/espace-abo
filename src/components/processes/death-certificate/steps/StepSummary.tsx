// Etape 5: Recapitulatif et validation (acte de deces)

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  recordTypeLabels,
  claimerTypeLabels,
  genderLabels,
  FRANCE_COUNTRY_ID,
} from '@/types/death-certificate';
import { formatPrice, type PricingProfile } from '@/lib/process-types';
import type { DeathCertificateInput } from '@/schemas/death-certificate';

export type PaymentMode = 'subscription' | 'one_time';

interface StepSummaryProps {
  isSubscriber: boolean;
  basePrice: number;
  pricing: PricingProfile;
  paymentMode: PaymentMode;
  onPaymentModeChange: (mode: PaymentMode) => void;
  subscriptionConsent: boolean;
  onSubscriptionConsentChange: (checked: boolean) => void;
}

export function StepSummary({
  isSubscriber,
  basePrice,
  pricing,
  paymentMode,
  onPaymentModeChange,
  subscriptionConsent,
  onSubscriptionConsentChange,
}: StepSummaryProps) {
  const SUBSCRIPTION_MONTHLY_PRICE = pricing.subscriptionMonthlyPrice;
  const { watch, setValue, formState: { errors } } = useFormContext<DeathCertificateInput>();
  const formData = watch();

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
        <SummaryCard title="Type d'acte">
          <p className="text-base font-medium">{recordTypeLabels[formData.recordType]}</p>
          <p className="form-gov-hint">{formData.recordCount} copie(s)</p>
        </SummaryCard>

        <SummaryCard title="Deces">
          <p className="text-base font-medium">Le {formatDate(formData.deathDate)}</p>
          <p className="form-gov-hint">
            a {formData.deathCityName}
            {formData.deathCountryId === FRANCE_COUNTRY_ID ? '' : ' (etranger)'}
          </p>
        </SummaryCard>

        <SummaryCard title="Personne decedee">
          <p className="text-base font-medium">
            {genderLabels[formData.gender]} {formData.firstName} {formData.lastName}
          </p>
          <p className="form-gov-hint">Ne(e) le {formatDate(formData.birthDate)}</p>
        </SummaryCard>

        <SummaryCard title="Lien avec le defunt">
          <p className="text-base">{claimerTypeLabels[formData.claimerType]}</p>
        </SummaryCard>

        <SummaryCard title="Adresse de livraison">
          <p className="text-base">
            {formData.deliveryAddress.street}, {formData.deliveryAddress.zipCode} {formData.deliveryAddress.city}
          </p>
        </SummaryCard>
      </div>

      {/* Tarification - non-abonnes */}
      {!isSubscriber && (
        <div className="space-y-4">
          {/* Mode 'subscription' : abo force, texte informatif */}
          {pricing.paymentMode === 'subscription' && (
            <div className="border-2 border-blue-700 bg-blue-50/50 p-5">
              <p className="text-base text-gray-900 leading-snug">
                Le traitement de votre demarche est realise dans le cadre du <strong>Service d'Assistance Administrative</strong> ({formatPrice(SUBSCRIPTION_MONTHLY_PRICE)}/mois).
                L'abonnement inclut le traitement illimite de vos demarches administratives.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Sans engagement — resiliable a tout moment depuis votre espace personnel, sans frais ni justificatif.
              </p>
            </div>
          )}

          {/* Mode 'both' : checkbox pour choisir */}
          {pricing.paymentMode === 'both' && (
            <div
              onClick={() => {
                const next = paymentMode === 'subscription' ? 'one_time' : 'subscription';
                onPaymentModeChange(next);
                if (next === 'one_time') onSubscriptionConsentChange(false);
                if (next === 'subscription') onSubscriptionConsentChange(true);
              }}
              className={`
                cursor-pointer border-2 p-5 transition-all
                ${paymentMode === 'subscription'
                  ? 'border-blue-700 bg-blue-50/50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">
                  <div className={`
                    w-5 h-5 border-2 flex items-center justify-center
                    ${paymentMode === 'subscription' ? 'border-blue-700 bg-blue-700' : 'border-gray-400 bg-white'}
                  `}>
                    {paymentMode === 'subscription' && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-base text-gray-900 leading-snug">
                    <strong>Je souscris au Service d'Assistance Administrative</strong> a {formatPrice(SUBSCRIPTION_MONTHLY_PRICE)}/mois.
                    L'abonnement inclut le traitement illimite de mes demarches administratives.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Sans engagement — resiliable a tout moment depuis mon espace personnel, sans frais ni justificatif.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mode 'one_time' : pas de proposition d'abo, rien a afficher */}
        </div>
      )}

      {/* Total */}
      <div className="bg-gray-50 px-5 py-4 flex justify-between items-center border-l-4 border-l-blue-700">
        <span className="font-semibold text-base text-gray-900">Total a payer</span>
        <div className="text-right">
          <span className="font-semibold text-base text-gray-900">
            {isSubscriber ? (
              'Inclus'
            ) : paymentMode === 'subscription' ? (
              formatPrice(SUBSCRIPTION_MONTHLY_PRICE)
            ) : (
              formatPrice(basePrice)
            )}
          </span>
        </div>
      </div>

      {/* Consentements — 3 cases separees */}
      <div className="space-y-3">
        {/* CGV */}
        <div className={`form-gov-checkbox-group ${watch('consents.acceptTerms') ? 'checked' : ''}`}>
          <input
            type="checkbox"
            id="acceptTerms"
            checked={!!watch('consents.acceptTerms')}
            onChange={(e) => setValue('consents.acceptTerms', e.target.checked as unknown as true, { shouldValidate: true })}
          />
          <label htmlFor="acceptTerms">
            J'accepte les{' '}
            <a href="/conditions-generales" target="_blank" className="text-blue-700 underline">
              conditions generales de vente
            </a>
            {' '}et je certifie l'exactitude des informations fournies. *
          </label>
        </div>

        {/* RGPD */}
        <div className={`form-gov-checkbox-group ${watch('consents.acceptDataProcessing') ? 'checked' : ''}`}>
          <input
            type="checkbox"
            id="acceptDataProcessing"
            checked={!!watch('consents.acceptDataProcessing')}
            onChange={(e) => {
              const val = e.target.checked as unknown as true;
              setValue('consents.acceptDataProcessing', val, { shouldValidate: true });
              setValue('consents.certifyAccuracy', val, { shouldValidate: true });
            }}
          />
          <label htmlFor="acceptDataProcessing">
            J'accepte le traitement de mes donnees personnelles conformement au RGPD et a la{' '}
            <a href="/politique-confidentialite" target="_blank" className="text-blue-700 underline">
              politique de confidentialite
            </a>. *
          </label>
        </div>

        {/* Retractation */}
        <div className={`form-gov-checkbox-group ${watch('consents.retractationExecution') ? 'checked' : ''}`}>
          <input
            type="checkbox"
            id="retractation"
            checked={!!watch('consents.retractationExecution')}
            onChange={(e) => {
              const val = e.target.checked as unknown as true;
              setValue('consents.retractationExecution', val, { shouldValidate: true });
              setValue('consents.retractationRenonciation', val, { shouldValidate: true });
            }}
          />
          <label htmlFor="retractation">
            Je demande l'execution immediate du service et renonce a mon droit de retractation
            conformement a l'article L221-28 du Code de la consommation. *
          </label>
        </div>

        {(errors.consents?.acceptTerms || errors.consents?.acceptDataProcessing || errors.consents?.certifyAccuracy) && (
          <p className="form-gov-error-msg">Vous devez accepter les conditions pour continuer.</p>
        )}
      </div>

      {/* Delai */}
      <p className="form-gov-hint">
        Traitement sous 3 a 5 jours ouvres apres validation. Envoi par courrier a l'adresse indiquee.
      </p>
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
