// Etape 2: Informations du bénéficiaire

'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { CityAutocomplete, type City, DateSelect } from '@/components/forms';
import { genderLabels, FRANCE_COUNTRY_ID } from '@/types/birth-certificate';
import { useCountries } from '@/hooks/useCountries';
import type { BirthCertificateInput } from '@/schemas/birth-certificate';

export function StepBeneficiary() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<BirthCertificateInput>();
  const selectedGender = watch('gender');
  const birthCountryId = watch('birthCountryId');
  const isFrance = birthCountryId === FRANCE_COUNTRY_ID;

  const { countriesWithFrance } = useCountries();

  // Restaurer la ville selectionnee depuis les valeurs du form (survit au remount)
  const existingCityId = watch('birthCityId');
  const existingCityName = watch('birthCityName');
  const [selectedCity, setSelectedCity] = useState<City | null>(
    existingCityId && existingCityName
      ? { id: existingCityId, name: existingCityName, postal_code: '', department_code: '' }
      : null
  );

  const handleCityChange = (city: City | null) => {
    setSelectedCity(city);
    if (city) {
      setValue('birthCityId', city.id, { shouldValidate: true });
      setValue('birthCityName', city.name, { shouldValidate: true });
    } else {
      setValue('birthCityId', undefined);
      setValue('birthCityName', '', { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Nom / Prenom */}
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

      {/* Pays de naissance */}
      <div className="mb-6">
        <label className="form-gov-label">
          Pays de naissance <span className="text-red-600">*</span>
        </label>
        <select
          value={birthCountryId === FRANCE_COUNTRY_ID ? '' : String(birthCountryId || '')}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') {
              setValue('birthCountryId', FRANCE_COUNTRY_ID, { shouldValidate: true });
            } else {
              setValue('birthCountryId', parseInt(val, 10), { shouldValidate: true });
              setValue('birthCityId', undefined);
              setValue('birthCityName', '', { shouldValidate: true });
              setSelectedCity(null);
            }
          }}
          className={`form-gov-select ${errors.birthCountryId ? 'form-gov-error' : ''}`}
        >
          {countriesWithFrance.map((c) => (
            <option key={c.id} value={c.id === 0 ? '' : String(c.id)}>{c.label}</option>
          ))}
        </select>
        {errors.birthCountryId && (
          <p className="form-gov-error-msg">{errors.birthCountryId.message}</p>
        )}
      </div>

      {/* Commune de naissance */}
      <div className="mb-6">
        {isFrance ? (
          <CityAutocomplete
            label="Commune de naissance"
            value={selectedCity}
            onChange={handleCityChange}
            error={errors.birthCityName?.message}
            required
          />
        ) : (
          <>
            <label className="form-gov-label">
              Ville de naissance <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              {...register('birthCityName')}
              className={`form-gov-input ${errors.birthCityName ? 'form-gov-error' : ''}`}
              placeholder="Nom de la ville de naissance"
            />
            <p className="form-gov-hint">
              Indiquez la ville telle qu'elle apparait sur l'acte de naissance
            </p>
            {errors.birthCityName && (
              <p className="form-gov-error-msg">{errors.birthCityName.message}</p>
            )}
          </>
        )}
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-50 border-l-4 border-l-blue-500">
        <p className="text-sm text-blue-900">
          Les informations doivent correspondre exactement a celles figurant
          sur l'acte de naissance original.
        </p>
      </div>
    </div>
  );
}

export default StepBeneficiary;
