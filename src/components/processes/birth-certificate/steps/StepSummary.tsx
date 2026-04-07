// Etape 5: Recapitulatif et validation

'use client';

import { useFormContext } from 'react-hook-form';
import { SharedStepSummary, SummaryCard, formatDate, type PaymentMode } from '@/components/processes/shared/StepSummary';
export type { PaymentMode } from '@/components/processes/shared/StepSummary';
import {
  recordTypeLabels,
  claimerTypeLabels,
  genderLabels,
  RecordType,
  FRANCE_COUNTRY_ID,
} from '@/types/birth-certificate';
import { type PricingProfile } from '@/lib/process-types';
import type { BirthCertificateInput } from '@/schemas/birth-certificate';

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
  const { watch } = useFormContext<BirthCertificateInput>();
  const formData = watch();

  const showParents = formData.recordType === RecordType.COPIE_INTEGRALE
    || formData.recordType === RecordType.EXTRAIT_FILIATION;

  return (
    <SharedStepSummary
      isSubscriber={isSubscriber}
      basePrice={basePrice}
      pricing={pricing}
      paymentMode={paymentMode}
      onPaymentModeChange={onPaymentModeChange}
      subscriptionConsent={subscriptionConsent}
      onSubscriptionConsentChange={onSubscriptionConsentChange}
      delayText="Traitement sous 3 a 5 jours ouvres apres validation. Envoi par courrier a l'adresse indiquee."
    >
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
    </SharedStepSummary>
  );
}

export default StepSummary;
