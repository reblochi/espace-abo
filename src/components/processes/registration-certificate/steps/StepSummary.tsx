// Etape 6: Recapitulatif et validation

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { OperationType, VehicleState } from '@/types/registration-certificate';
import type { RegistrationCertificateInput } from '@/schemas/registration-certificate';
import type { RegistrationCertificateTaxes } from '@/lib/taxes/registration-certificate';

interface StepSummaryProps {
  taxes: RegistrationCertificateTaxes | null;
  isSubscriber: boolean;
}

const OPERATION_LABELS: Record<number, string> = {
  [OperationType.CHANGEMENT_TITULAIRE]: 'Changement de titulaire',
  [OperationType.CHANGEMENT_ADRESSE]: 'Changement d\'adresse',
  [OperationType.DUPLICATA]: 'Duplicata',
  [OperationType.CORRECTION]: 'Correction d\'erreur',
};

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' EUR';
}

export function StepSummary({ taxes, isSubscriber }: StepSummaryProps) {
  const { register, watch, formState: { errors } } = useFormContext<RegistrationCertificateInput>();

  const formData = watch();
  const { claimer, holder, vehicle, operation, coOwner } = formData;

  return (
    <div className="space-y-6">
      {/* Recapitulatif */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type d'operation */}
        <SummaryCard title="Type d'operation">
          <p className="font-medium">{OPERATION_LABELS[operation.typeId]}</p>
        </SummaryCard>

        {/* Demandeur */}
        <SummaryCard title="Demandeur">
          <p className="font-medium">
            {claimer.civility === 1 ? 'M.' : 'Mme'} {claimer.firstName} {claimer.lastName}
          </p>
          <p className="text-sm text-gray-500">{claimer.email}</p>
          <p className="text-sm text-gray-500">{claimer.phone}</p>
          {claimer.isHolder && (
            <span className="text-xs text-blue-600">(egalement titulaire)</span>
          )}
        </SummaryCard>

        {/* Titulaire */}
        <SummaryCard title="Titulaire">
          {holder.isCompany ? (
            <>
              <p className="font-medium">{holder.companyName}</p>
              <p className="text-sm text-gray-500">SIRET: {holder.siret}</p>
            </>
          ) : (
            <p className="font-medium">
              {holder.civility === 1 ? 'M.' : 'Mme'} {holder.firstName} {holder.lastName}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {holder.address}<br />
            {holder.postalCode} {holder.city}
          </p>
        </SummaryCard>

        {/* Co-titulaire */}
        {coOwner && (
          <SummaryCard title="Co-titulaire">
            <p className="font-medium">
              {coOwner.civility === 1 ? 'M.' : 'Mme'} {coOwner.firstName} {coOwner.lastName}
            </p>
          </SummaryCard>
        )}

        {/* Vehicule */}
        <SummaryCard title="Vehicule" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Immatriculation</p>
              <p className="font-medium">{vehicle.registrationNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Marque / Modele</p>
              <p className="font-medium">{vehicle.make} {vehicle.model}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Etat</p>
              <p className="font-medium">
                {vehicle.state === VehicleState.NEUF ? 'Neuf' : 'Occasion'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Puissance fiscale</p>
              <p className="font-medium">{vehicle.fiscalPower} CV</p>
            </div>
            {vehicle.co2 && (
              <div>
                <p className="text-sm text-gray-500">Emissions CO2</p>
                <p className="font-medium">{vehicle.co2} g/km</p>
              </div>
            )}
          </div>
        </SummaryCard>
      </div>

      {/* Detail des couts */}
      {taxes && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-4">Detail du cout</h3>
          <div className="space-y-2">
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
            <div className="flex justify-between">
              <span className="text-gray-600">Frais de service</span>
              {isSubscriber ? (
                <span className="text-green-600">
                  <span className="line-through text-gray-400 mr-2">
                    {formatPrice(taxes.serviceFee)}
                  </span>
                  Inclus
                </span>
              ) : (
                <span>{formatPrice(taxes.serviceFee)}</span>
              )}
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-medium text-lg">
              <span>Total a payer</span>
              <span className="text-blue-600">
                {formatPrice(isSubscriber ? taxes.total - taxes.serviceFee : taxes.total)}
              </span>
            </div>
            {isSubscriber && (
              <p className="text-sm text-green-600 text-right">
                Vous economisez {formatPrice(taxes.serviceFee)} grace a votre abonnement
              </p>
            )}
          </div>
        </div>
      )}

      {/* Consentements */}
      <div className="space-y-4 bg-white rounded-lg border p-6">
        <h3 className="font-medium text-gray-900 mb-4">Validation</h3>

        <label className={cn(
          'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
          watch('consents.acceptTerms')
            ? 'border-blue-200 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        )}>
          <input
            type="checkbox"
            {...register('consents.acceptTerms')}
            className="mt-1"
          />
          <span className="text-sm">
            J'accepte les{' '}
            <a href="/conditions-generales" target="_blank" className="text-blue-600 underline">
              conditions generales de vente
            </a>{' '}
            et la{' '}
            <a href="/politique-confidentialite" target="_blank" className="text-blue-600 underline">
              politique de confidentialite
            </a>
            . *
          </span>
        </label>
        {errors.consents?.acceptTerms && (
          <p className="text-sm text-red-600">{errors.consents.acceptTerms.message}</p>
        )}

        <label className={cn(
          'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
          watch('consents.acceptDataProcessing')
            ? 'border-blue-200 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        )}>
          <input
            type="checkbox"
            {...register('consents.acceptDataProcessing')}
            className="mt-1"
          />
          <span className="text-sm">
            J'autorise le traitement de mes donnees personnelles pour la realisation de ma demarche
            conformement au RGPD. *
          </span>
        </label>
        {errors.consents?.acceptDataProcessing && (
          <p className="text-sm text-red-600">{errors.consents.acceptDataProcessing.message}</p>
        )}

        <label className={cn(
          'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
          watch('consents.certifyAccuracy')
            ? 'border-blue-200 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        )}>
          <input
            type="checkbox"
            {...register('consents.certifyAccuracy')}
            className="mt-1"
          />
          <span className="text-sm">
            Je certifie que les informations fournies sont exactes et completes.
            Je suis informe(e) que toute fausse declaration peut entrainer l'annulation
            de ma demande. *
          </span>
        </label>
        {errors.consents?.certifyAccuracy && (
          <p className="text-sm text-red-600">{errors.consents.certifyAccuracy.message}</p>
        )}
      </div>

      {/* Info delai */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-medium text-blue-800">Delai de traitement</h4>
            <p className="text-sm text-blue-700 mt-1">
              Votre demarche sera traitee sous 5 a 7 jours ouvres apres validation de votre dossier.
              Vous recevrez votre certificat d'immatriculation par courrier a l'adresse indiquee.
            </p>
          </div>
        </div>
      </div>
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
    <div className={cn('bg-white rounded-lg border p-4', className)}>
      <h4 className="text-sm font-medium text-gray-500 mb-2">{title}</h4>
      {children}
    </div>
  );
}

export default StepSummary;
