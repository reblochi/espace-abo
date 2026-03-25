// Etape 2: Identite du titulaire de la carte d'identite

'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { CityAutocomplete, type City } from '@/components/forms';
import {
  genderLabels,
  FRANCE_COUNTRY_ID,
  NationalityReason,
  nationalityReasonLabels,
  UsageNameType,
  usageNameTypeLabels,
  AdditionalNameWord,
  additionalNameWordLabels,
} from '@/types/identity-card';
import { useCountries } from '@/hooks/useCountries';
import type { IdentityCardInput } from '@/schemas/identity-card';

const inputClass = 'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const errorInputClass = 'border-red-500 focus:ring-red-500';

export function StepIdentity() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<IdentityCardInput>();
  const selectedGender = watch('gender');
  const birthCountryId = watch('birthCountryId');
  const isFrance = birthCountryId === FRANCE_COUNTRY_ID;
  const nomUsage = watch('nomUsage');
  const hasNomUsage = !!nomUsage && nomUsage.trim().length > 0;

  const { countriesWithFrance } = useCountries();
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
            Nom de naissance <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('nom')}
            className={cn(inputClass, errors.nom && errorInputClass)}
            placeholder="Nom de naissance"
          />
          {errors.nom && (
            <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prenom(s) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('prenom')}
            className={cn(inputClass, errors.prenom && errorInputClass)}
            placeholder="Prenom(s)"
          />
          {errors.prenom && (
            <p className="mt-1 text-sm text-red-600">{errors.prenom.message}</p>
          )}
        </div>
      </div>

      {/* Nom d'usage */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom d'usage (epouse/epoux)
        </label>
        <input
          type="text"
          {...register('nomUsage')}
          className={cn(inputClass, errors.nomUsage && errorInputClass)}
          placeholder="Facultatif"
        />
        {errors.nomUsage && (
          <p className="mt-1 text-sm text-red-600">{errors.nomUsage.message}</p>
        )}
      </div>

      {/* Type nom d'usage + Mot additionnel (conditionnel) */}
      {hasNomUsage && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de nom d'usage <span className="text-red-500">*</span>
            </label>
            <select
              {...register('typeNomUsage')}
              className={cn(inputClass, errors.typeNomUsage && errorInputClass)}
            >
              <option value="">Selectionnez...</option>
              {(Object.entries(usageNameTypeLabels) as [string, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.typeNomUsage && (
              <p className="mt-1 text-sm text-red-600">{errors.typeNomUsage.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot a faire apparaitre
            </label>
            <select
              {...register('motAdditionnelNom')}
              className={inputClass}
            >
              <option value="">Aucun</option>
              {(Object.entries(additionalNameWordLabels) as [string, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Date de naissance */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date de naissance <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          {...register('birthDate')}
          className={cn(inputClass, errors.birthDate && errorInputClass)}
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
        <select
          value={birthCountryId === FRANCE_COUNTRY_ID ? '' : String(birthCountryId || '')}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') {
              // France
              setValue('birthCountryId', FRANCE_COUNTRY_ID, { shouldValidate: true });
            } else {
              setValue('birthCountryId', parseInt(val, 10), { shouldValidate: true });
              setValue('birthCityId', undefined);
              setValue('birthCityName', '', { shouldValidate: true });
              setSelectedCity(null);
            }
          }}
          className={cn(inputClass, errors.birthCountryId && errorInputClass)}
        >
          {countriesWithFrance.map((c) => (
            <option key={c.id} value={c.id === 0 ? '' : String(c.id)}>{c.label}</option>
          ))}
        </select>
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
            className={cn(inputClass, errors.birthCityName && errorInputClass)}
            placeholder="Nom de la ville de naissance"
          />
          {errors.birthCityName && (
            <p className="mt-1 text-sm text-red-600">{errors.birthCityName.message}</p>
          )}
        </div>
      )}

      {/* Taille */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Taille (en cm) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          {...register('taille', { valueAsNumber: true })}
          className={cn(inputClass, errors.taille && errorInputClass)}
          placeholder="170"
          min={20}
          max={280}
        />
        {errors.taille && (
          <p className="mt-1 text-sm text-red-600">{errors.taille.message}</p>
        )}
      </div>

      {/* Raison nationalite francaise */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Vous etes francais(e) parce que... <span className="text-red-500">*</span>
        </label>
        <select
          {...register('raisonFrancais')}
          className={cn(inputClass, errors.raisonFrancais && errorInputClass)}
        >
          <option value="">Selectionnez une raison...</option>
          {(Object.values(NationalityReason)).map((value) => (
            <option key={value} value={value}>{nationalityReasonLabels[value]}</option>
          ))}
        </select>
        {errors.raisonFrancais && (
          <p className="mt-1 text-sm text-red-600">{errors.raisonFrancais.message}</p>
        )}
      </div>
    </div>
  );
}

export default StepIdentity;
