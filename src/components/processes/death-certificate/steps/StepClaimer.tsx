// Etape 3: Demandeur - lien avec le defunt (sans informations parents)

'use client';

import { useFormContext } from 'react-hook-form';
import { claimerTypeLabels } from '@/types/death-certificate';
import type { DeathCertificateInput } from '@/schemas/death-certificate';

export function StepClaimer() {
  const { watch, setValue, formState: { errors } } = useFormContext<DeathCertificateInput>();
  const selectedClaimerType = watch('claimerType');

  return (
    <div className="space-y-6">
      {/* Lien avec le defunt */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Votre lien avec le defunt
        </h2>
        <p className="form-gov-hint">
          Quel est votre lien avec la personne concernee par l'acte ?
        </p>
      </div>

      <div className="space-y-2">
        {(Object.entries(claimerTypeLabels) as [string, string][]).map(([value, label]) => (
          <label
            key={value}
            onClick={() => setValue('claimerType', value as DeathCertificateInput['claimerType'], { shouldValidate: true })}
            className={`
              flex items-center p-4 cursor-pointer transition-colors duration-150 border-l-4
              ${selectedClaimerType === value
                ? 'bg-blue-50 border-l-blue-700'
                : 'bg-gray-50 border-l-transparent hover:bg-blue-50/50'
              }
            `}
          >
            <input
              type="radio"
              value={value}
              checked={selectedClaimerType === value}
              onChange={() => setValue('claimerType', value as DeathCertificateInput['claimerType'], { shouldValidate: true })}
              className="sr-only"
            />
            <div className={`
              w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0
              ${selectedClaimerType === value ? 'border-blue-700' : 'border-gray-500'}
            `}>
              {selectedClaimerType === value && (
                <div className="w-3 h-3 rounded-full bg-blue-700" />
              )}
            </div>
            <span className={`text-base ${selectedClaimerType === value ? 'font-semibold text-gray-900' : 'text-gray-900'}`}>
              {label}
            </span>
          </label>
        ))}
      </div>
      {errors.claimerType && (
        <p className="form-gov-error-msg">{errors.claimerType.message}</p>
      )}
    </div>
  );
}

export default StepClaimer;
