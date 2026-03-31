// Etape 2: Informations du bénéficiaire

'use client';

import * as React from 'react';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { CityAutocomplete, type City } from '@/components/forms';
import { genderLabels, FRANCE_COUNTRY_ID } from '@/types/birth-certificate';
import type { BirthCertificateInput } from '@/schemas/birth-certificate';

export function StepBeneficiary() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<BirthCertificateInput>();
  const selectedGender = watch('gender');
  const birthCountryId = watch('birthCountryId');
  const isFrance = birthCountryId === FRANCE_COUNTRY_ID;

  // State local pour le CityAutocomplete (evite les re-renders qui ecrasent l'input)
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

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
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Civilite <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          {(Object.entries(genderLabels) as [string, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue('gender', value as 'MALE' | 'FEMALE', { shouldValidate: true })}
              className={cn(
                'px-6 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                selectedGender === value
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {errors.gender && (
          <p className="mt-2 text-sm text-red-600">{errors.gender.message}</p>
        )}
      </div>

      {/* Nom / Prenom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prenom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('firstName')}
            className={cn(
              'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
              'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              errors.firstName && 'border-red-500 focus:ring-red-500'
            )}
            placeholder="Prenom du bénéficiaire"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('lastName')}
            className={cn(
              'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
              'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              errors.lastName && 'border-red-500 focus:ring-red-500'
            )}
            placeholder="Nom du bénéficiaire"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* Date de naissance */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date de naissance <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          {...register('birthDate')}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            errors.birthDate && 'border-red-500 focus:ring-red-500'
          )}
        />
        {errors.birthDate && (
          <p className="mt-1 text-sm text-red-600">{errors.birthDate.message}</p>
        )}
      </div>

      {/* Pays de naissance */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pays de naissance <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setValue('birthCountryId', FRANCE_COUNTRY_ID, { shouldValidate: true })}
            className={cn(
              'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all',
              isFrance
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            )}
          >
            France
          </button>
          <button
            type="button"
            onClick={() => {
              setValue('birthCountryId', 0, { shouldValidate: true });
              setValue('birthCityId', undefined);
              setValue('birthCityName', '', { shouldValidate: true });
              setSelectedCity(null);
            }}
            className={cn(
              'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all',
              !isFrance && birthCountryId !== undefined
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'
            )}
          >
            Autre pays
          </button>
        </div>
        {errors.birthCountryId && (
          <p className="mt-1 text-sm text-red-600">{errors.birthCountryId.message}</p>
        )}
      </div>

      {/* Commune de naissance */}
      {isFrance ? (
        <CityAutocomplete
          label="Commune de naissance"
          value={selectedCity}
          onChange={handleCityChange}
          error={errors.birthCityName?.message}
          required
        />
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ville de naissance <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('birthCityName')}
            className={cn(
              'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
              'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              errors.birthCityName && 'border-red-500 focus:ring-red-500'
            )}
            placeholder="Nom de la ville de naissance"
          />
          {errors.birthCityName && (
            <p className="mt-1 text-sm text-red-600">{errors.birthCityName.message}</p>
          )}
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-700">
            Les informations doivent correspondre exactement a celles figurant
            sur l'acte de naissance original.
          </p>
        </div>
      </div>
    </div>
  );
}

export default StepBeneficiary;
