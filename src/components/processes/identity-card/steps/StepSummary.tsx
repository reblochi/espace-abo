// Etape 6: Recapitulatif et validation

'use client';

import { useFormContext } from 'react-hook-form';
import { SharedStepSummary, SummaryCard, formatDate, type PaymentMode } from '@/components/processes/shared/StepSummary';
export type { PaymentMode } from '@/components/processes/shared/StepSummary';
import {
  genderLabels,
  requestMotifLabels,
  nationalityReasonLabels,
  FRANCE_COUNTRY_ID,
  calculateStampTax,
  type RequestMotifValue,
  type NationalityReasonValue,
} from '@/types/identity-card';
import { type PricingProfile } from '@/lib/process-types';
import type { IdentityCardInput } from '@/schemas/identity-card';

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
  const { watch } = useFormContext<IdentityCardInput>();
  const formData = watch();

  const stampTax = calculateStampTax(formData.motif, formData.deliveryAddress?.zipCode);

  return (
    <SharedStepSummary
      isSubscriber={isSubscriber}
      basePrice={basePrice}
      pricing={pricing}
      paymentMode={paymentMode}
      onPaymentModeChange={onPaymentModeChange}
      subscriptionConsent={subscriptionConsent}
      onSubscriptionConsentChange={onSubscriptionConsentChange}
      delayText="Traitement sous 10 a 15 jours ouvres apres validation. Un recepisse de demande vous sera envoye par email."
      extraAmountCents={stampTax}
      extraLabel="Timbre fiscal (obligatoire)"
    >
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
    </SharedStepSummary>
  );
}

export default StepSummary;
