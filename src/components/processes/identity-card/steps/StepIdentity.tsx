// Etape 2: Identite du titulaire de la carte d'identité

'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
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

export function StepIdentity() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<IdentityCardInput>();
  const selectedGender = watch('gender');
  const birthCountryId = watch('birthCountryId');
  const isFrance = birthCountryId === FRANCE_COUNTRY_ID;
  const nomUsage = watch('nomUsage');
  const hasNomUsage = !!nomUsage && nomUsage.trim().length > 0;

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
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Personne concernee par la carte d'identité
        </h2>
        <p className="form-gov-hint">
          Renseignez les informations telles qu'elles apparaissent sur l'acte de naissance
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

      {/* Nom de naissance */}
      <div className="mb-6">
        <label className="form-gov-label">
          Nom de naissance <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          {...register('nom')}
          className={`form-gov-input ${errors.nom ? 'form-gov-error' : ''}`}
        />
        {errors.nom && (
          <p className="form-gov-error-msg">{errors.nom.message}</p>
        )}
      </div>

      {/* Prenom(s) */}
      <div className="mb-6">
        <label className="form-gov-label">
          Prenom(s) <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          {...register('prenom')}
          className={`form-gov-input ${errors.prenom ? 'form-gov-error' : ''}`}
        />
        <p className="form-gov-hint">
          Separez vos prenoms par des espaces
        </p>
        {errors.prenom && (
          <p className="form-gov-error-msg">{errors.prenom.message}</p>
        )}
      </div>

      {/* Nom d'usage */}
      <div className="mb-6">
        <label className="form-gov-label">
          Nom d'usage <span className="text-gray-500 font-normal">(facultatif)</span>
        </label>
        <input
          type="text"
          {...register('nomUsage')}
          className={`form-gov-input ${errors.nomUsage ? 'form-gov-error' : ''}`}
        />
        <p className="form-gov-hint">
          Nom d'epoux/epouse si different du nom de naissance
        </p>
        {errors.nomUsage && (
          <p className="form-gov-error-msg">{errors.nomUsage.message}</p>
        )}
      </div>

      {/* Type nom d'usage + Mot additionnel (conditionnel) */}
      {hasNomUsage && (
        <div className="p-4 bg-gray-50 space-y-4 border-l-4 border-l-blue-700">
          <p className="form-gov-hint">
            Le nom d'usage permet de faire figurer sur la carte d'identité le nom de votre conjoint(e)
            ou le nom de l'un de vos parents, en plus de votre nom de naissance.
          </p>

          <div className="mb-4">
            <label className="form-gov-label">
              Il s'agit du nom de votre <span className="text-red-600">*</span>
            </label>
            <select
              {...register('typeNomUsage')}
              className={`form-gov-select ${errors.typeNomUsage ? 'form-gov-error' : ''}`}
            >
              <option value="">Selectionnez...</option>
              {(Object.entries(usageNameTypeLabels) as [string, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.typeNomUsage && (
              <p className="form-gov-error-msg">{errors.typeNomUsage.message}</p>
            )}
          </div>

          <div>
            <label className="form-gov-label">
              Mot a faire apparaitre <span className="text-gray-500 font-normal">(facultatif)</span>
            </label>
            <select
              {...register('motAdditionnelNom')}
              className="form-gov-select"
            >
              <option value="">Aucun</option>
              {(Object.entries(additionalNameWordLabels) as [string, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <p className="form-gov-hint">
              Exemple : "Epoux DUPONT" ou "Veuf MARTIN"
            </p>
          </div>
        </div>
      )}

      {/* Date de naissance */}
      <div className="mb-6">
        <label className="form-gov-label">
          Date de naissance <span className="text-red-600">*</span>
        </label>
        <input
          type="date"
          {...register('birthDate')}
          className={`form-gov-input ${errors.birthDate ? 'form-gov-error' : ''}`}
        />
        {errors.birthDate && (
          <p className="form-gov-error-msg">{errors.birthDate.message}</p>
        )}
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
              Indiquez la ville telle qu'elle apparait sur votre acte de naissance
            </p>
            {errors.birthCityName && (
              <p className="form-gov-error-msg">{errors.birthCityName.message}</p>
            )}
          </>
        )}
      </div>

      {/* Taille */}
      <div className="border-t border-gray-200 pt-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Votre taille
          </h2>
        </div>
        <div className="mb-6">
          <label className="form-gov-label">
            Taille (en cm) <span className="text-red-600">*</span>
          </label>
          <input
            type="number"
            {...register('taille', { valueAsNumber: true })}
            className={`form-gov-input ${errors.taille ? 'form-gov-error' : ''}`}
            placeholder="170"
            min={20}
            max={280}
          />
          {errors.taille && (
            <p className="form-gov-error-msg">{errors.taille.message}</p>
          )}
        </div>
      </div>

      {/* Raison nationalite francaise */}
      <div className="mb-6">
        <label className="form-gov-label">
          Vous etes francais(e) parce que... <span className="text-red-600">*</span>
        </label>
        <select
          {...register('raisonFrancais')}
          className={`form-gov-select ${errors.raisonFrancais ? 'form-gov-error' : ''}`}
        >
          <option value="">Selectionnez une raison...</option>
          {(Object.values(NationalityReason)).map((value) => (
            <option key={value} value={value}>{nationalityReasonLabels[value]}</option>
          ))}
        </select>
        {errors.raisonFrancais && (
          <p className="form-gov-error-msg">{errors.raisonFrancais.message}</p>
        )}
      </div>
    </div>
  );
}

export default StepIdentity;
