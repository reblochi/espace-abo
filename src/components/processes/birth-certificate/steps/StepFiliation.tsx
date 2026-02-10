// Etape 3: Filiation (lien demandeur + parents)

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { ClaimerType, claimerTypeLabels, RecordType } from '@/types/birth-certificate';
import type { BirthCertificateInput } from '@/schemas/birth-certificate';

export function StepFiliation() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<BirthCertificateInput>();
  const selectedClaimerType = watch('claimerType');
  const recordType = watch('recordType');

  const fatherUnknown = watch('fatherUnknown');
  const motherUnknown = watch('motherUnknown');

  // Les parents sont demandes pour copie_integrale et extrait_filiation
  const showParents = recordType === RecordType.COPIE_INTEGRALE || recordType === RecordType.EXTRAIT_FILIATION;

  return (
    <div className="space-y-8">
      {/* Lien avec le beneficiaire */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-4">
          Quel est votre lien avec la personne concernee par l'acte ?
        </h3>
        <div className="space-y-2">
          {(Object.entries(claimerTypeLabels) as [string, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue('claimerType', value as BirthCertificateInput['claimerType'], { shouldValidate: true })}
              className={cn(
                'w-full flex items-center p-3 rounded-lg border-2 text-left text-sm transition-all',
                selectedClaimerType === value
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              )}
            >
              <div className={cn(
                'w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0',
                selectedClaimerType === value
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-gray-300'
              )}>
                {selectedClaimerType === value && (
                  <div className="w-full h-full rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                )}
              </div>
              {label}
            </button>
          ))}
        </div>
        {errors.claimerType && (
          <p className="mt-2 text-sm text-red-600">{errors.claimerType.message}</p>
        )}
      </div>

      {/* Informations parents (conditionnel) */}
      {showParents && (
        <div className="space-y-6">
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Informations des parents</h3>
            <p className="text-sm text-gray-500 mb-4">
              Ces informations sont requises pour une copie integrale ou un extrait avec filiation.
            </p>
          </div>

          {/* Pere */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Pere</h4>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fatherUnknown}
                  onChange={(e) => {
                    setValue('fatherUnknown', e.target.checked, { shouldValidate: true });
                    if (e.target.checked) {
                      setValue('fatherFirstName', '');
                      setValue('fatherLastName', '');
                    }
                  }}
                  className="rounded border-gray-300"
                />
                Pere inconnu
              </label>
            </div>

            {!fatherUnknown && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prenom</label>
                  <input
                    type="text"
                    {...register('fatherFirstName')}
                    className={cn(
                      'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
                      'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      errors.fatherFirstName && 'border-red-500 focus:ring-red-500'
                    )}
                    placeholder="Prenom du pere"
                  />
                  {errors.fatherFirstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fatherFirstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    {...register('fatherLastName')}
                    className={cn(
                      'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
                      'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      errors.fatherLastName && 'border-red-500 focus:ring-red-500'
                    )}
                    placeholder="Nom du pere"
                  />
                  {errors.fatherLastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fatherLastName.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mere */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Mere</h4>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={motherUnknown}
                  onChange={(e) => {
                    setValue('motherUnknown', e.target.checked, { shouldValidate: true });
                    if (e.target.checked) {
                      setValue('motherFirstName', '');
                      setValue('motherLastName', '');
                    }
                  }}
                  className="rounded border-gray-300"
                />
                Mere inconnue
              </label>
            </div>

            {!motherUnknown && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prenom</label>
                  <input
                    type="text"
                    {...register('motherFirstName')}
                    className={cn(
                      'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
                      'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      errors.motherFirstName && 'border-red-500 focus:ring-red-500'
                    )}
                    placeholder="Prenom de la mere"
                  />
                  {errors.motherFirstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.motherFirstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    {...register('motherLastName')}
                    className={cn(
                      'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
                      'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      errors.motherLastName && 'border-red-500 focus:ring-red-500'
                    )}
                    placeholder="Nom de la mere"
                  />
                  {errors.motherLastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.motherLastName.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info si pas de parents demandes */}
      {!showParents && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            Pour le type d'extrait selectionne, les informations des parents ne sont pas requises.
          </p>
        </div>
      )}
    </div>
  );
}

export default StepFiliation;
