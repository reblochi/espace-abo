// Etape 5: Recapitulatif et validation

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  recordTypeLabels,
  claimerTypeLabels,
  genderLabels,
  RecordType,
  FRANCE_COUNTRY_ID,
} from '@/types/birth-certificate';
import { formatPrice, type PricingProfile } from '@/lib/process-types';
import type { BirthCertificateInput } from '@/schemas/birth-certificate';

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
  const { watch, setValue, formState: { errors } } = useFormContext<BirthCertificateInput>();
  const formData = watch();

  const showParents = formData.recordType === RecordType.COPIE_INTEGRALE
    || formData.recordType === RecordType.EXTRAIT_FILIATION;

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

        <SummaryCard title="Beneficiaire">
          <p className="text-base font-medium">
            {genderLabels[formData.gender]} {formData.firstName} {formData.lastName}
          </p>
          <p className="form-gov-hint">
            Ne(e) le {formatDate(formData.birthDate)} a {formData.birthCityName}
            {formData.birthCountryId === FRANCE_COUNTRY_ID ? '' : ' (etranger)'}
          </p>
        </SummaryCard>

        <SummaryCard title="Lien avec le beneficiaire">
          <p className="text-base">{claimerTypeLabels[formData.claimerType]}</p>
        </SummaryCard>

        {showParents && (
          <SummaryCard title="Filiation">
            <p className="text-base">
              Pere : {formData.fatherUnknown ? <span className="italic text-gray-400">Inconnu</span> : `${formData.fatherFirstName} ${formData.fatherLastName}`}
            </p>
            <p className="text-base">
              Mere : {formData.motherUnknown ? <span className="italic text-gray-400">Inconnue</span> : `${formData.motherFirstName} ${formData.motherLastName}`}
            </p>
          </SummaryCard>
        )}

        <SummaryCard title="Adresse de livraison">
          <p className="text-base">
            {formData.deliveryAddress.street}, {formData.deliveryAddress.zipCode} {formData.deliveryAddress.city}
          </p>
        </SummaryCard>
      </div>

      {/* Consentements — 3 cases separees */}
      <div className="space-y-3">
        {/* Souscription — meme style que les autres cases */}
        {!isSubscriber && pricing.paymentMode !== 'one_time' && (
          <div className={`form-gov-checkbox-group ${paymentMode === 'subscription' ? 'checked' : ''}`}>
            <input
              type="checkbox"
              id="subscriptionOpt"
              checked={paymentMode === 'subscription'}
              onChange={(e) => {
                onPaymentModeChange(e.target.checked ? 'subscription' : 'one_time');
                onSubscriptionConsentChange(e.target.checked);
              }}
            />
            <label htmlFor="subscriptionOpt">
              Je souscris au Service d'Assistance Administrative a {formatPrice(SUBSCRIPTION_MONTHLY_PRICE)}/mois.
              L'abonnement inclut le traitement illimite de mes demarches, sans engagement, resiliable a tout moment.
              {paymentMode !== 'subscription' && (
                <span className="text-gray-400"> (Sans abonnement : {formatPrice(basePrice)})</span>
              )}
            </label>
          </div>
        )}

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
