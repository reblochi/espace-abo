// Etape 5: Recapitulatif et validation (acte de deces)

'use client';

import { useFormContext } from 'react-hook-form';
import { SharedStepSummary, SummaryCard, formatDate, type PaymentMode } from '@/components/processes/shared/StepSummary';
export type { PaymentMode } from '@/components/processes/shared/StepSummary';
import {
  recordTypeLabels,
  claimerTypeLabels,
  genderLabels,
  FRANCE_COUNTRY_ID,
} from '@/types/death-certificate';
import { type PricingProfile } from '@/lib/process-types';
import type { DeathCertificateInput } from '@/schemas/death-certificate';

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
  const { watch } = useFormContext<DeathCertificateInput>();
  const formData = watch();

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
    </SharedStepSummary>
  );
}

export default StepSummary;
