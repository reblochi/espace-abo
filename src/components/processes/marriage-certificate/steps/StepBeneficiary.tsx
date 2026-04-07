// Etape 2: Informations de l'epoux 1 (beneficiaire)

'use client';

import { useFormContext } from 'react-hook-form';
import { DateSelect } from '@/components/forms';
import { genderLabels } from '@/types/birth-certificate';
import type { MarriageCertificateInput } from '@/schemas/marriage-certificate';

export function StepBeneficiary() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<MarriageCertificateInput>();
  const selectedGender = watch('gender');

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border-l-4 border-l-blue-500 mb-6">
        <p className="text-sm text-blue-900">
          Renseignez les informations de la premiere personne concernee par l'acte de mariage.
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
                onChange={() => setValue('gender', value as 'MALE' | 'FEMALE', { shouldValidate: true })}
                className="sr-only"
              />
              <span className={`font-semibold text-base ${selectedGender === value ? 'text-blue-700' : 'text-gray-900'}`}>
                {label}
              </span>
            </label>
          ))}
        </div>
        {errors.gender && (
          <p className="form-gov-error-msg">{errors.gender.message}</p>
        )}
      </div>

      {/* Nom */}
      <div className="mb-6">
        <label className="form-gov-label">
          Nom de naissance <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          {...register('lastName')}
          className={`form-gov-input ${errors.lastName ? 'form-gov-error' : ''}`}
        />
        {errors.lastName && (
          <p className="form-gov-error-msg">{errors.lastName.message}</p>
        )}
      </div>

      {/* Prenom */}
      <div className="mb-6">
        <label className="form-gov-label">
          Prenom(s) <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          {...register('firstName')}
          className={`form-gov-input ${errors.firstName ? 'form-gov-error' : ''}`}
        />
        <p className="form-gov-hint">
          Separez les prenoms par des espaces
        </p>
        {errors.firstName && (
          <p className="form-gov-error-msg">{errors.firstName.message}</p>
        )}
      </div>

      {/* Nom d'usage */}
      <div className="mb-6">
        <label className="form-gov-label">
          Nom d'usage <span className="text-gray-400 text-sm">(facultatif)</span>
        </label>
        <input
          type="text"
          {...register('nomUsage')}
          className={`form-gov-input ${errors.nomUsage ? 'form-gov-error' : ''}`}
          placeholder="Nom d'usage si different du nom de naissance"
        />
        {errors.nomUsage && (
          <p className="form-gov-error-msg">{errors.nomUsage.message}</p>
        )}
      </div>

      {/* Date de naissance */}
      <div className="mb-6">
        <DateSelect
          label="Date de naissance"
          value={watch('birthDate') || ''}
          onChange={(val) => setValue('birthDate', val, { shouldValidate: true })}
          error={errors.birthDate?.message}
          required
        />
      </div>
    </div>
  );
}

export default StepBeneficiary;
