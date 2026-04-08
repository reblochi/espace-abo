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
            Taille <span className="text-red-600">*</span>
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <select
                value={Math.floor((watch('taille') || 175) / 100)}
                onChange={(e) => {
                  const m = parseInt(e.target.value, 10);
                  const currentCm = (watch('taille') || 175) % 100;
                  setValue('taille', m * 100 + currentCm, { shouldValidate: true });
                }}
                className={`form-gov-select w-20 ${errors.taille ? 'form-gov-error' : ''}`}
              >
                {[0, 1, 2].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <span className="text-sm text-gray-600 font-medium">m</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={(watch('taille') || 175) % 100}
                onChange={(e) => {
                  const cm = parseInt(e.target.value, 10);
                  const currentM = Math.floor((watch('taille') || 175) / 100);
                  setValue('taille', currentM * 100 + cm, { shouldValidate: true });
                }}
                className={`form-gov-select w-24 ${errors.taille ? 'form-gov-error' : ''}`}
              >
                {Array.from({ length: 100 }, (_, i) => i).map((cm) => (
                  <option key={cm} value={cm}>{String(cm).padStart(2, '0')}</option>
                ))}
              </select>
              <span className="text-sm text-gray-600 font-medium">cm</span>
            </div>
          </div>
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
