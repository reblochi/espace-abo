// Etape 5: Recapitulatif avec SharedStepSummary

'use client';

import { useFormContext } from 'react-hook-form';
import { operationTypeLabels, vehicleStateLabels, duplicateReasonLabels, OperationType } from '@/types/registration-certificate';
import type { RegistrationCertificateInput } from '@/schemas/registration-certificate';
import type { RegistrationCertificateTaxes } from '@/lib/taxes/registration-certificate';
import {
  SharedStepSummary,
  SummaryCard,
  formatDate,
  type PaymentMode,
} from '@/components/processes/shared/StepSummary';
import { formatPrice, type PricingProfile } from '@/lib/process-types';

interface StepSummaryProps {
  taxes: RegistrationCertificateTaxes | null;
  isSubscriber: boolean;
  basePrice: number;
  pricing: PricingProfile;
  paymentMode: PaymentMode;
  onPaymentModeChange: (mode: PaymentMode) => void;
  subscriptionConsent: boolean;
  onSubscriptionConsentChange: (checked: boolean) => void;
}

export function StepSummary({
  taxes,
  isSubscriber,
  basePrice,
  pricing,
  paymentMode,
  onPaymentModeChange,
  subscriptionConsent,
  onSubscriptionConsentChange,
}: StepSummaryProps) {
  const { watch } = useFormContext<RegistrationCertificateInput>();
  const formData = watch();
  const { operation, holder, vehicle, coOwner } = formData;

  const taxesTotal = taxes
    ? taxes.taxeRegionale + taxes.taxeGestion + taxes.taxeAcheminement + taxes.malus
    : 0;

  return (
    <SharedStepSummary
      isSubscriber={isSubscriber}
      basePrice={basePrice}
      pricing={pricing}
      paymentMode={paymentMode}
      onPaymentModeChange={onPaymentModeChange}
      subscriptionConsent={subscriptionConsent}
      onSubscriptionConsentChange={onSubscriptionConsentChange}
      delayText="Traitement sous 5 a 7 jours ouvres apres validation. Envoi du certificat par courrier."
      extraAmountCents={taxesTotal}
      extraLabel="Taxes administratives"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <SummaryCard title="Operation">
          <p>{operationTypeLabels[operation.typeId]}</p>
          {operation.typeId === OperationType.DUPLICATA && operation.duplicateReason !== undefined && (
            <p className="text-sm text-gray-500">Motif : {duplicateReasonLabels[operation.duplicateReason]}</p>
          )}
          {operation.maxAddressChange && (
            <p className="text-sm text-gray-500">3+ changements d'adresse</p>
          )}
        </SummaryCard>

        <SummaryCard title="Titulaire">
          {holder.isCompany ? (
            <>
              <p>{holder.companyName}</p>
              {holder.siren && <p className="text-sm text-gray-500">SIREN : {holder.siren}</p>}
            </>
          ) : (
            <>
              <p>{holder.civility === 'M' ? 'M.' : 'Mme'} {holder.firstName} {holder.lastName}</p>
              {holder.birthDate && <p className="text-sm text-gray-500">Ne(e) le {formatDate(holder.birthDate)} a {holder.birthCityName}</p>}
            </>
          )}
          <p className="text-sm text-gray-500">{holder.address}, {holder.zipCode} {holder.city}</p>
        </SummaryCard>

        {coOwner?.hasCoOwner && coOwner.firstName && (
          <SummaryCard title="Co-titulaire">
            <p>{coOwner.firstName} {coOwner.lastName}</p>
          </SummaryCard>
        )}

        <SummaryCard title="Vehicule">
          <p className="font-medium">{vehicle.registrationNumber}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            {operation.typeId === OperationType.CHANGEMENT_TITULAIRE && (
              <span>{vehicleStateLabels[vehicle.state]}</span>
            )}
            <span>{vehicle.fiscalPower} CV</span>
            {vehicle.co2 ? <span>{vehicle.co2} g/km CO2</span> : null}
            {vehicle.registrationDate && <span>1ere immat. {formatDate(vehicle.registrationDate)}</span>}
          </div>
        </SummaryCard>

        <SummaryCard title="Demandeur">
          <p>{formData.requesterFirstName} {formData.requesterLastName}</p>
          <p className="text-sm text-gray-500">{formData.email}</p>
          <p className="text-sm text-gray-500">{formData.telephone}</p>
        </SummaryCard>
      </div>

      {/* Detail taxes */}
      {taxes && (
        <div className="bg-gray-50 rounded-lg px-5 py-4 mt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Detail des taxes administratives</h4>
          <div className="space-y-1.5 text-sm">
            {taxes.taxeRegionale > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Taxe regionale</span>
                <span>{formatPrice(taxes.taxeRegionale)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Taxe de gestion</span>
              <span>{formatPrice(taxes.taxeGestion)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Redevance d'acheminement</span>
              <span>{formatPrice(taxes.taxeAcheminement)}</span>
            </div>
            {taxes.malus > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Malus ecologique</span>
                <span>{formatPrice(taxes.malus)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </SharedStepSummary>
  );
}

export default StepSummary;
