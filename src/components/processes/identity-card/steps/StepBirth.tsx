// Etape 3: Naissance et nationalite du titulaire

'use client';

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { CityAutocomplete, type City, DateSelect } from '@/components/forms';
import {
  FRANCE_COUNTRY_ID,
  NationalityReason,
  nationalityReasonLabels,
} from '@/types/identity-card';
import { useCountries } from '@/hooks/useCountries';
import type { IdentityCardInput } from '@/schemas/identity-card';

export function StepBirth() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<IdentityCardInput>();
  const birthCountryId = watch('birthCountryId');
  const isFrance = birthCountryId === FRANCE_COUNTRY_ID;

  const { countriesWithFrance } = useCountries();

  // Si ne en France, preselectionner la raison et la masquer
  useEffect(() => {
    if (isFrance) {
      setValue('raisonFrancais', NationalityReason.PARENT_FRANCAIS, { shouldValidate: true });
    }
  }, [isFrance, setValue]);

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
          Naissance et nationalite
        </h2>
        <p className="form-gov-hint">
          Renseignez les informations telles qu'elles apparaissent sur l'acte de naissance
        </p>
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
          <select
            value={watch('taille') || ''}
            onChange={(e) => {
              const val = e.target.value;
              setValue('taille', val ? parseInt(val, 10) : (undefined as unknown as number), { shouldValidate: true });
            }}
            className={`form-gov-select ${errors.taille ? 'form-gov-error' : ''}`}
          >
            <option value="">Selectionnez...</option>
            {Array.from({ length: 261 }, (_, i) => i + 20).map((cm) => (
              <option key={cm} value={cm}>{cm} cm</option>
            ))}
          </select>
          {errors.taille && (
            <p className="form-gov-error-msg">{errors.taille.message}</p>
          )}
        </div>
      </div>

      {/* Raison nationalite francaise — masque si ne en France */}
      {!isFrance && (
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
      )}
    </div>
  );
}

export default StepBirth;
