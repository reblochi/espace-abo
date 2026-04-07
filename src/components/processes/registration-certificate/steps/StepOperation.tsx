// Etape 1: Selection du type d'operation

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { OperationType, DuplicateReason } from '@/types/registration-certificate';
import type { RegistrationCertificateInput } from '@/schemas/registration-certificate';

const OPERATION_TYPES = [
  {
    id: OperationType.CHANGEMENT_TITULAIRE,
    label: 'Changement de titulaire',
    description: 'Achat d\'un vehicule d\'occasion aupres d\'un particulier ou professionnel',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: OperationType.CHANGEMENT_ADRESSE,
    label: 'Changement d\'adresse',
    description: 'Mise à jour de l\'adresse sur votre carte grise',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: OperationType.DUPLICATA,
    label: 'Duplicata',
    description: 'Carte grise perdue, volee ou deterioree',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: OperationType.CORRECTION,
    label: 'Correction d\'erreur',
    description: 'Erreur sur la carte grise a corriger',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
];

const DUPLICATE_REASONS = [
  { id: DuplicateReason.PERTE, label: 'Perte' },
  { id: DuplicateReason.VOL, label: 'Vol' },
  { id: DuplicateReason.DETERIORATION, label: 'Deterioration' },
];

export function StepOperation() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<RegistrationCertificateInput>();
  const selectedType = watch('operation.typeId');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {OPERATION_TYPES.map((type) => (
          <button
            key={`op-${type.id}`}
            type="button"
            onClick={() => setValue('operation.typeId', type.id, { shouldValidate: true })}
            className={cn(
              'flex items-start p-4 rounded-lg border-2 text-left transition-all',
              selectedType === type.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            <div className={cn(
              'p-2 rounded-lg mr-4',
              selectedType === type.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
            )}>
              {type.icon}
            </div>
            <div>
              <h3 className={cn(
                'font-medium',
                selectedType === type.id ? 'text-blue-900' : 'text-gray-900'
              )}>
                {type.label}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{type.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Raison du duplicata si necessaire */}
      {selectedType === OperationType.DUPLICATA && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Raison du duplicata
          </label>
          <div className="flex flex-wrap gap-3">
            {DUPLICATE_REASONS.map((reason) => (
              <label
                key={reason.id}
                className={cn(
                  'flex items-center px-4 py-2 rounded-lg border cursor-pointer transition-colors',
                  watch('operation.duplicateReason') === reason.id
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <input
                  type="radio"
                  {...register('operation.duplicateReason')}
                  value={reason.id}
                  className="sr-only"
                />
                <span>{reason.label}</span>
              </label>
            ))}
          </div>
          {errors.operation?.duplicateReason && (
            <p className="mt-2 text-sm text-red-600">
              {errors.operation.duplicateReason.message}
            </p>
          )}
        </div>
      )}

      {errors.operation?.typeId && (
        <p className="text-sm text-red-600">
          {errors.operation.typeId.message}
        </p>
      )}
    </div>
  );
}

export default StepOperation;
