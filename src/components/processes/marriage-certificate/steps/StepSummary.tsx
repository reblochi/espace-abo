// Etape recapitulatif pour l'acte de mariage

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
import type { MarriageCertificateInput } from '@/schemas/marriage-certificate';

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
  const { watch } = useFormContext<MarriageCertificateInput>();
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
      <div className="grid grid-cols-2 gap-2">
        <SummaryCard title="Type d'acte">
          <p className="font-medium">{recordTypeLabels[formData.recordType]} ({formData.recordCount} copie(s))</p>
        </SummaryCard>

        <SummaryCard title="Mariage">
          <p className="font-medium">{formatDate(formData.marriageDate)}</p>
          <p className="text-gray-500">{formData.marriageCityName}{formData.marriageCountryId === FRANCE_COUNTRY_ID ? '' : ' (etranger)'}</p>
        </SummaryCard>

        <SummaryCard title="Epoux(se) 1">
          <p className="font-medium">{formData.gender && genderLabels[formData.gender]} {formData.firstName} {formData.lastName}</p>
          <p className="text-gray-500">Ne(e) le {formatDate(formData.birthDate)}</p>
        </SummaryCard>

        <SummaryCard title="Epoux(se) 2">
          <p className="font-medium">{formData.spouseGender && genderLabels[formData.spouseGender]} {formData.spouseFirstName} {formData.spouseLastName}</p>
          <p className="text-gray-500">Ne(e) le {formatDate(formData.spouseBirthDate)}</p>
        </SummaryCard>

        {showParents && (
          <SummaryCard title="Parents epoux 1">
            <p>P: {formData.fatherUnknown ? <span className="italic text-gray-400">Inconnu</span> : `${formData.fatherFirstName} ${formData.fatherLastName}`}</p>
            <p>M: {formData.motherUnknown ? <span className="italic text-gray-400">Inconnue</span> : `${formData.motherFirstName} ${formData.motherLastName}`}</p>
          </SummaryCard>
        )}

        {showParents && (
          <SummaryCard title="Parents epoux 2">
            <p>P: {formData.spouseFatherUnknown ? <span className="italic text-gray-400">Inconnu</span> : `${formData.spouseFatherFirstName} ${formData.spouseFatherLastName}`}</p>
            <p>M: {formData.spouseMotherUnknown ? <span className="italic text-gray-400">Inconnue</span> : `${formData.spouseMotherFirstName} ${formData.spouseMotherLastName}`}</p>
          </SummaryCard>
        )}

        <div className="col-span-2">
          <SummaryCard title="Livraison">
            <p>{formData.deliveryAddress?.street}, {formData.deliveryAddress?.zipCode} {formData.deliveryAddress?.city}</p>
          </SummaryCard>
        </div>
      </div>
    </SharedStepSummary>
  );
}

export default StepSummary;
