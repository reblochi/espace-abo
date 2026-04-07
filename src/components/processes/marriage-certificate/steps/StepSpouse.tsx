// Etape 4: Informations du conjoint (Epoux 2)

'use client';

import { useFormContext } from 'react-hook-form';
import { DateSelect } from '@/components/forms';
import { genderLabels } from '@/types/birth-certificate';
import type { MarriageCertificateInput } from '@/schemas/marriage-certificate';

export function StepSpouse() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<MarriageCertificateInput>();
  const selectedGender = watch('spouseGender');

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border-l-4 border-l-blue-500 mb-6">
        <p className="text-sm text-blue-900">
          Renseignez les informations de la seconde personne concernee par l'acte de mariage.
        </p>
      </div>

      {/* Civilite */}
      <div className="mb-6">
        <label className="form-gov-label mb-3">
          Civilite <span className="text-red-600">*</span>
        </label>
        <div className="flex gap-3">
          {(Object.entries(genderLabels) as [string, string][]).map(([value, label]) => (
            <label
              key={value}
              className={`
                flex-1 flex items-center justify-center p-3 cursor-pointer transition-colors duration-150 border-2
                ${selectedGender === value
                  ? 'border-blue-700 bg-blue-50'
                  : 'border-gray-400 bg-white hover:bg-gray-50'
                }
              `}
            >
              <input
                type="radio"
                value={value}
                checked={selectedGender === value}
                onChange={() => setValue('spouseGender', value as 'MALE' | 'FEMALE', { shouldValidate: true })}
                className="sr-only"
              />
              <span className={`font-semibold text-base ${selectedGender === value ? 'text-blue-700' : 'text-gray-900'}`}>
                {label}
              </span>
            </label>
          ))}
        </div>
        {errors.spouseGender && (
          <p className="form-gov-error-msg">{errors.spouseGender.message}</p>
        )}
      </div>

      {/* Nom */}
      <div className="mb-6">
        <label className="form-gov-label">
          Nom de naissance <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          {...register('spouseLastName')}
          className={`form-gov-input ${errors.spouseLastName ? 'form-gov-error' : ''}`}
        />
        {errors.spouseLastName && (
          <p className="form-gov-error-msg">{errors.spouseLastName.message}</p>
        )}
      </div>

      {/* Prenom */}
      <div className="mb-6">
        <label className="form-gov-label">
          Prenom(s) <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          {...register('spouseFirstName')}
          className={`form-gov-input ${errors.spouseFirstName ? 'form-gov-error' : ''}`}
        />
        <p className="form-gov-hint">
          Separez les prenoms par des espaces
        </p>
        {errors.spouseFirstName && (
          <p className="form-gov-error-msg">{errors.spouseFirstName.message}</p>
        )}
      </div>

      {/* Nom d'usage */}
      <div className="mb-6">
        <label className="form-gov-label">
          Nom d'usage <span className="text-gray-400 text-sm">(facultatif)</span>
        </label>
        <input
          type="text"
          {...register('spouseNomUsage')}
          className={`form-gov-input ${errors.spouseNomUsage ? 'form-gov-error' : ''}`}
          placeholder="Nom d'usage si different du nom de naissance"
        />
        {errors.spouseNomUsage && (
          <p className="form-gov-error-msg">{errors.spouseNomUsage.message}</p>
        )}
      </div>

      {/* Date de naissance */}
      <div className="mb-6">
        <DateSelect
          label="Date de naissance"
          value={watch('spouseBirthDate') || ''}
          onChange={(val) => setValue('spouseBirthDate', val, { shouldValidate: true })}
          error={errors.spouseBirthDate?.message}
          required
        />
      </div>
    </div>
  );
}

export default StepSpouse;
