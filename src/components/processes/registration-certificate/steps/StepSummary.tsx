// Etape 6: Recapitulatif et validation

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { OperationType, VehicleState } from '@/types/registration-certificate';
import type { RegistrationCertificateInput } from '@/schemas/registration-certificate';
import type { RegistrationCertificateTaxes } from '@/lib/taxes/registration-certificate';

export type PaymentMode = 'subscription' | 'one_time';

const SUBSCRIPTION_MONTHLY_PRICE = 990; // 9,90 EUR en centimes

interface StepSummaryProps {
  taxes: RegistrationCertificateTaxes | null;
  isSubscriber: boolean;
  paymentMode: PaymentMode;
  onPaymentModeChange: (mode: PaymentMode) => void;
  subscriptionConsent: boolean;
  onSubscriptionConsentChange: (checked: boolean) => void;
}

const OPERATION_LABELS: Record<number, string> = {
  [OperationType.CHANGEMENT_TITULAIRE]: 'Changement de titulaire',
  [OperationType.CHANGEMENT_ADRESSE]: 'Changement d\'adresse',
  [OperationType.DUPLICATA]: 'Duplicata',
};

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' EUR';
}

export function StepSummary({
  taxes,
  isSubscriber,
  paymentMode,
  onPaymentModeChange,
  subscriptionConsent,
  onSubscriptionConsentChange,
}: StepSummaryProps) {
  const { watch, setValue, formState: { errors } } = useFormContext<RegistrationCertificateInput>();
  const formData = watch();
  const { claimer, holder, vehicle, operation, coOwner } = formData;

  const allConsentsAccepted = watch('consents.termsAccepted')
    && watch('consents.dataProcessingAccepted');

  const handleAllConsents = (checked: boolean) => {
    const val = checked as unknown as true;
    setValue('consents.termsAccepted', val, { shouldValidate: true });
    setValue('consents.dataProcessingAccepted', val, { shouldValidate: true });
  };

  const serviceFee = taxes?.serviceFee ?? 7990;
  const taxesOnly = taxes ? taxes.total - taxes.serviceFee : 0;
  const savings = serviceFee - SUBSCRIPTION_MONTHLY_PRICE;

  return (
    <div className="space-y-5">
      {/* Recapitulatif */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <SummaryCard title="Operation">
          <p className="font-medium">{OPERATION_LABELS[operation.typeId] || 'Demarche carte grise'}</p>
        </SummaryCard>

        <SummaryCard title="Demandeur">
          <p className="font-medium">
            {claimer.civility === 'M' ? 'M.' : 'Mme'} {claimer.firstName} {claimer.lastName}
          </p>
          <p className="text-sm text-gray-500">{claimer.email}</p>
        </SummaryCard>

        <SummaryCard title="Titulaire">
          <p className="font-medium">
            {holder.siren
              ? <>{holder.company} <span className="text-xs text-gray-400">({holder.siren})</span></>
              : <>{holder.civility === 'M' ? 'M.' : 'Mme'} {holder.firstName} {holder.lastName}</>
            }
          </p>
          <p className="text-sm text-gray-500">
            {holder.address}, {holder.zipCode} {holder.city}
          </p>
        </SummaryCard>

        {coOwner?.firstName && (
          <SummaryCard title="Co-titulaire">
            <p className="font-medium">{coOwner.firstName} {coOwner.lastName}</p>
          </SummaryCard>
        )}

        <SummaryCard title="Vehicule" className="lg:col-span-2">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span><span className="text-gray-500">Immat.</span> <strong>{vehicle.registrationNumber}</strong></span>
            <span><span className="text-gray-500">Etat</span> {vehicle.state === VehicleState.NEUF ? 'Neuf' : 'Occasion'}</span>
            <span><span className="text-gray-500">Puissance</span> {vehicle.fiscalPower} CV</span>
            {vehicle.co2 ? <span><span className="text-gray-500">CO2</span> {vehicle.co2} g/km</span> : null}
          </div>
        </SummaryCard>
      </div>

      {/* Choix formule - non-abonnes */}
      {!isSubscriber && (
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Frais de service</h3>
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
              <p className="text-xs text-gray-500 ml-7 mt-0.5">Frais de service inclus - Sans engagement</p>
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
              <p className="text-xl font-bold text-gray-900 ml-7">{formatPrice(serviceFee)}</p>
              <p className="text-xs text-gray-500 ml-7 mt-0.5">Cette demarche uniquement</p>
            </button>
          </div>
        </div>
      )}

      {/* Detail des couts */}
      {taxes && (
        <div className="bg-gray-50 rounded-lg px-5 py-4">
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
              <span className="text-gray-600">Acheminement</span>
              <span>{formatPrice(taxes.taxeAcheminement)}</span>
            </div>
            {taxes.malus > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Malus ecologique</span>
                <span>{formatPrice(taxes.malus)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Frais de service</span>
              {isSubscriber || paymentMode === 'subscription' ? (
                <span className="text-green-600">
                  <span className="line-through text-gray-400 mr-1 text-xs">{formatPrice(taxes.serviceFee)}</span>
                  Inclus
                </span>
              ) : (
                <span>{formatPrice(taxes.serviceFee)}</span>
              )}
            </div>
            {!isSubscriber && paymentMode === 'subscription' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Abonnement mensuel</span>
                <span>{formatPrice(SUBSCRIPTION_MONTHLY_PRICE)}/mois</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2 flex justify-between font-medium text-base">
              <span>Total a payer</span>
              <div className="text-right">
                <span className="text-blue-600">
                  {isSubscriber
                    ? formatPrice(taxesOnly)
                    : paymentMode === 'subscription'
                      ? formatPrice(taxesOnly + SUBSCRIPTION_MONTHLY_PRICE)
                      : formatPrice(taxes.total)
                  }
                </span>
                {(isSubscriber || (!isSubscriber && paymentMode === 'subscription')) && savings > 0 && (
                  <span className="block text-xs text-green-600">
                    Economie de {formatPrice(isSubscriber ? serviceFee : savings)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation */}
      <div className="space-y-3">
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
        {(errors.consents?.termsAccepted || errors.consents?.dataProcessingAccepted) && (
          <p className="text-sm text-red-600">Vous devez accepter les conditions pour continuer.</p>
        )}

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
              Je souscris à l'abonnement mensuel Assistance Administrative ({formatPrice(SUBSCRIPTION_MONTHLY_PRICE)}/mois),
              resiliable a tout moment depuis mon espace membre, sans frais. *
            </span>
          </label>
        )}
      </div>

      {/* Delai */}
      <p className="text-xs text-gray-500">
        Traitement sous 5 a 7 jours ouvres apres validation. Envoi du certificat par courrier a l'adresse indiquée.
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

export default StepSummary;
