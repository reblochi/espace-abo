// Etape 4: Informations du vehicule

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { VehicleState } from '@/types/registration-certificate';
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
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RegistrationCertificateInput>();

  const vehicleState = watch('vehicle.state');
  const energyId = watch('vehicle.energyId');

  const isCleanVehicle = ENERGY_TYPES.find(e => e.value === energyId)?.isClean ?? false;

  return (
    <div className="space-y-6">
      {/* Etat du vehicule */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700">
          Etat du vehicule :
        </span>
        <div className="flex gap-3">
          <label className={cn(
            'px-4 py-2 rounded-lg border cursor-pointer transition-colors',
            vehicleState === VehicleState.NEUF
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300'
          )}>
            <input
              type="radio"
              checked={vehicleState === VehicleState.NEUF}
              onChange={() => setValue('vehicle.state', VehicleState.NEUF)}
              className="sr-only"
            />
            Neuf
          </label>
          <label className={cn(
            'px-4 py-2 rounded-lg border cursor-pointer transition-colors',
            vehicleState === VehicleState.OCCASION
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300'
          )}>
            <input
              type="radio"
              checked={vehicleState === VehicleState.OCCASION}
              onChange={() => setValue('vehicle.state', VehicleState.OCCASION)}
              className="sr-only"
            />
            Occasion
          </label>
        </div>
      </div>

      {/* Informations du vehicule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Immatriculation *
          </label>
          <Input
            {...register('vehicle.registrationNumber')}
            error={errors.vehicle?.registrationNumber?.message}
            placeholder="AA-123-BB"
            className="uppercase"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de 1ere immatriculation *
          </label>
          <Input
            type="date"
            {...register('vehicle.registrationDate')}
            error={errors.vehicle?.registrationDate?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marque *
          </label>
          <Input
            {...register('vehicle.make')}
            error={errors.vehicle?.make?.message}
            placeholder="Renault, Peugeot..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Modele *
          </label>
          <Input
            {...register('vehicle.model')}
            error={errors.vehicle?.model?.message}
            placeholder="Clio, 208..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de vehicule *
          </label>
          <Select
            {...register('vehicle.typeId', { valueAsNumber: true })}
            error={errors.vehicle?.typeId?.message}
          >
            <option value="">Selectionnez</option>
            {VEHICLE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Energie *
          </label>
          <Select
            {...register('vehicle.energyId', { valueAsNumber: true })}
            error={errors.vehicle?.energyId?.message}
          >
            <option value="">Selectionnez</option>
            {ENERGY_TYPES.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label} {e.isClean && '(Exonere de taxe regionale)'}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Puissance fiscale (CV) *
          </label>
          <Input
            type="number"
            {...register('vehicle.fiscalPower', { valueAsNumber: true })}
            error={errors.vehicle?.fiscalPower?.message}
            placeholder="5"
            min={1}
            max={100}
          />
          <p className="text-xs text-gray-500 mt-1">
            Case P.6 de la carte grise
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Emissions CO2 (g/km)
            {vehicleState === VehicleState.NEUF && ' *'}
          </label>
          <Input
            type="number"
            {...register('vehicle.co2', { valueAsNumber: true })}
            error={errors.vehicle?.co2?.message}
            placeholder="120"
            min={0}
            max={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            Case V.7 de la carte grise (si indique)
          </p>
        </div>
      </div>

      {/* Info vehicule propre */}
      {isCleanVehicle && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <h4 className="font-medium text-green-800">Vehicule propre</h4>
              <p className="text-sm text-green-700 mt-1">
                Les vehicules electriques et hydrogene sont exoneres de taxe regionale.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estimation des taxes */}
      {taxes && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Estimation du cout
            {isCalculating && (
              <svg className="w-4 h-4 ml-2 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </h4>

          <div className="space-y-2">
            {taxes.taxeRegionale > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taxe regionale</span>
                <span className="font-medium">{formatPrice(taxes.taxeRegionale)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Taxe de gestion</span>
              <span className="font-medium">{formatPrice(taxes.taxeGestion)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Redevance d'acheminement</span>
              <span className="font-medium">{formatPrice(taxes.taxeAcheminement)}</span>
            </div>
            {taxes.malus > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Malus ecologique</span>
                <span className="font-medium">{formatPrice(taxes.malus)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Frais de service</span>
              <span className="font-medium">{formatPrice(taxes.serviceFee)}</span>
            </div>
            <div className="border-t pt-2 mt-2 flex justify-between font-medium">
              <span>Total estime</span>
              <span className="text-lg text-blue-600">{formatPrice(taxes.total)}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            * Ce montant est une estimation. Le montant final peut varier en fonction des informations
            fournies lors de la validation de votre dossier.
          </p>
        </div>
      )}
    </div>
  );
}

export default StepVehicle;
