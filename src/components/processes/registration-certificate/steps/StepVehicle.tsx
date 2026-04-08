// Etape 3: Informations du vehicule

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { VehicleState, OperationType } from '@/types/registration-certificate';
import type { RegistrationCertificateInput } from '@/schemas/registration-certificate';
import type { RegistrationCertificateTaxes } from '@/lib/taxes/registration-certificate';

const VEHICLE_TYPES = [
  { value: 1, label: 'Voiture particuliere (VP)' },
  { value: 2, label: 'Camionnette (CTTE)' },
  { value: 3, label: 'Moto' },
  { value: 4, label: 'Cyclomoteur' },
  { value: 5, label: 'Remorque' },
  { value: 6, label: 'Camping-car' },
];

const ENERGY_TYPES = [
  { value: 1, label: 'Electrique', isClean: true },
  { value: 2, label: 'Hydrogene', isClean: true },
  { value: 3, label: 'Hybride rechargeable', isClean: false },
  { value: 4, label: 'Essence', isClean: false },
  { value: 5, label: 'Diesel', isClean: false },
  { value: 6, label: 'GPL', isClean: false },
  { value: 7, label: 'Hybride non rechargeable', isClean: false },
];

interface StepVehicleProps {
  taxes: RegistrationCertificateTaxes | null;
  isCalculating: boolean;
}

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' EUR';
}

export function StepVehicle({ taxes, isCalculating }: StepVehicleProps) {
  const { register, watch, setValue, formState: { errors } } = useFormContext<RegistrationCertificateInput>();

  const vehicleState = watch('vehicle.state');
  const energyId = watch('vehicle.energyId');
  const operationType = watch('operation.typeId');

  const isCleanVehicle = ENERGY_TYPES.find(e => e.value === energyId)?.isClean ?? false;
  const vehicleErrors = errors.vehicle as Record<string, { message?: string }> | undefined;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Informations du vehicule</h2>
        <p className="form-gov-hint">Ces informations se trouvent sur votre carte grise actuelle.</p>
      </div>

      {/* Etat du vehicule (seulement changement titulaire) */}
      {operationType === OperationType.CHANGEMENT_TITULAIRE && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Etat du vehicule :</span>
          <div className="flex gap-3">
            <label className={cn(
              'px-4 py-2 rounded-lg border cursor-pointer transition-colors',
              vehicleState === VehicleState.OCCASION
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            )}>
              <input type="radio" checked={vehicleState === VehicleState.OCCASION} onChange={() => setValue('vehicle.state', VehicleState.OCCASION)} className="sr-only" />
              Occasion
            </label>
            <label className={cn(
              'px-4 py-2 rounded-lg border cursor-pointer transition-colors',
              vehicleState === VehicleState.NEUF
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            )}>
              <input type="radio" checked={vehicleState === VehicleState.NEUF} onChange={() => setValue('vehicle.state', VehicleState.NEUF)} className="sr-only" />
              Neuf
            </label>
          </div>
        </div>
      )}

      {/* Immatriculation + date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-gov-label">Immatriculation <span className="text-red-600">*</span></label>
          <input type="text" {...register('vehicle.registrationNumber')} className={`form-gov-input uppercase ${vehicleErrors?.registrationNumber ? 'form-gov-error' : ''}`} placeholder="AA-123-BB" />
          <p className="form-gov-hint">Case A de la carte grise</p>
          {vehicleErrors?.registrationNumber && <p className="form-gov-error-msg">{vehicleErrors.registrationNumber.message}</p>}
        </div>
        <div>
          <label className="form-gov-label">Date de 1ere immatriculation <span className="text-red-600">*</span></label>
          <input type="date" {...register('vehicle.registrationDate')} className={`form-gov-input ${vehicleErrors?.registrationDate ? 'form-gov-error' : ''}`} />
          <p className="form-gov-hint">Case B de la carte grise</p>
          {vehicleErrors?.registrationDate && <p className="form-gov-error-msg">{vehicleErrors.registrationDate.message}</p>}
        </div>
      </div>

      {/* Type + Energie */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-gov-label">Type de vehicule <span className="text-red-600">*</span></label>
          <select {...register('vehicle.vehicleTypeId', { valueAsNumber: true })} className={`form-gov-input ${vehicleErrors?.vehicleTypeId ? 'form-gov-error' : ''}`}>
            <option value="">Selectionnez</option>
            {VEHICLE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <p className="form-gov-hint">Case J.1 de la carte grise</p>
          {vehicleErrors?.vehicleTypeId && <p className="form-gov-error-msg">{vehicleErrors.vehicleTypeId.message}</p>}
        </div>
        <div>
          <label className="form-gov-label">Energie <span className="text-red-600">*</span></label>
          <select {...register('vehicle.energyId', { valueAsNumber: true })} className={`form-gov-input ${vehicleErrors?.energyId ? 'form-gov-error' : ''}`}>
            <option value="">Selectionnez</option>
            {ENERGY_TYPES.map((e) => (
              <option key={e.value} value={e.value}>{e.label} {e.isClean && '(Exonere de taxe)'}</option>
            ))}
          </select>
          <p className="form-gov-hint">Case P.3 de la carte grise</p>
          {vehicleErrors?.energyId && <p className="form-gov-error-msg">{vehicleErrors.energyId.message}</p>}
        </div>
      </div>

      {/* Puissance + CO2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-gov-label">Puissance fiscale (CV) <span className="text-red-600">*</span></label>
          <input type="number" {...register('vehicle.fiscalPower', { valueAsNumber: true })} className={`form-gov-input ${vehicleErrors?.fiscalPower ? 'form-gov-error' : ''}`} placeholder="5" min={1} max={100} />
          <p className="form-gov-hint">Case P.6 de la carte grise</p>
          {vehicleErrors?.fiscalPower && <p className="form-gov-error-msg">{vehicleErrors.fiscalPower.message}</p>}
        </div>
        <div>
          <label className="form-gov-label">Emissions CO2 (g/km){vehicleState === VehicleState.NEUF && ' *'}</label>
          <input type="number" {...register('vehicle.co2', { valueAsNumber: true })} className={`form-gov-input ${vehicleErrors?.co2 ? 'form-gov-error' : ''}`} placeholder="120" min={0} max={500} />
          <p className="form-gov-hint">Case V.7 de la carte grise (si indique)</p>
          {vehicleErrors?.co2 && <p className="form-gov-error-msg">{vehicleErrors.co2.message}</p>}
        </div>
      </div>

      {/* Controle technique */}
      <div>
        <label className="form-gov-label">Date du controle technique</label>
        <input type="date" {...register('vehicle.technicalControlDate')} className="form-gov-input" />
        <p className="form-gov-hint">Obligatoire pour les vehicules de plus de 4 ans</p>
      </div>

      {/* Vehicule propre */}
      {isCleanVehicle && (
        <div className="p-4 bg-green-50 border-l-4 border-l-green-500">
          <p className="text-sm text-green-800 font-medium">Vehicule propre — exonere de taxe regionale</p>
        </div>
      )}

      {/* Estimation des taxes */}
      {taxes && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            Estimation du cout
            {isCalculating && (
              <svg className="w-4 h-4 ml-2 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </h4>
          <div className="space-y-1.5 text-sm">
            {taxes.taxeRegionale > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Taxe regionale</span>
                <span className="font-medium">{formatPrice(taxes.taxeRegionale)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Taxe de gestion</span>
              <span className="font-medium">{formatPrice(taxes.taxeGestion)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Redevance d'acheminement</span>
              <span className="font-medium">{formatPrice(taxes.taxeAcheminement)}</span>
            </div>
            {taxes.malus > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Malus ecologique</span>
                <span className="font-medium">{formatPrice(taxes.malus)}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2 flex justify-between font-medium">
              <span>Total taxes</span>
              <span className="text-blue-600">{formatPrice(taxes.taxeRegionale + taxes.taxeGestion + taxes.taxeAcheminement + taxes.malus)}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">* Estimation indicative. Le montant final sera confirme au recapitulatif.</p>
        </div>
      )}
    </div>
  );
}

export default StepVehicle;
