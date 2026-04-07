// Etape 4: Demandeur et adresse de livraison

'use client';

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { genderLabels } from '@/types/identity-card';
import { DateSelect } from '@/components/forms';
import { PostalCityAutocomplete } from '@/components/forms/PostalCityAutocomplete';
import type { IdentityCardInput } from '@/schemas/identity-card';

export function StepRequester() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<IdentityCardInput>();

  const isTitulaire = watch('isTitulaire');
  const deliveryErrors = errors.deliveryAddress;

  // Quand "je suis le titulaire" est coche, copier les infos du titulaire
  useEffect(() => {
    if (isTitulaire) {
      const gender = watch('gender');
      const nom = watch('nom');
      const prenom = watch('prenom');
      const birthDate = watch('birthDate');
      if (gender) setValue('requesterGender', gender);
      if (nom) setValue('requesterLastName', nom);
      if (prenom) setValue('requesterFirstName', prenom);
      if (birthDate) setValue('requesterBirthDate', birthDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTitulaire]);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Adresse de la personne concernee par le titre
        </h2>
      </div>

      {/* Checkbox titulaire */}
      <div className={`form-gov-checkbox-group ${isTitulaire ? 'checked' : ''}`}>
        <input
          type="checkbox"
          id="isTitulaire"
          checked={isTitulaire}
          onChange={(e) => setValue('isTitulaire', e.target.checked)}
        />
        <label htmlFor="isTitulaire">
          Je suis le titulaire de la carte d'identité
        </label>
      </div>

      {/* Infos demandeur (si different du titulaire) */}
      {!isTitulaire && (
        <div className="p-4 bg-gray-50 space-y-4">
          <h3 className="form-gov-section-title">Informations du demandeur</h3>
          <p className="form-gov-hint mb-4">
            Si le titulaire est mineur, renseignez les informations du representant legal.
          </p>

          {/* Civilite demandeur */}
          <div className="mb-4">
            <label className="form-gov-label mb-3">Civilite</label>
            <div className="flex gap-3">
              {(Object.entries(genderLabels) as [string, string][]).map(([value, label]) => (
                <label
                  key={value}
                  className={`
                    flex-1 flex items-center justify-center p-3 cursor-pointer transition-colors duration-150 border-2
                    ${watch('requesterGender') === value
                      ? 'border-blue-700 bg-blue-50'
                      : 'border-gray-400 bg-white hover:bg-gray-50'
                    }
                  `}
                >
                  <input
                    type="radio"
                    value={value}
                    checked={watch('requesterGender') === value}
                    onChange={() => setValue('requesterGender', value as 'MALE' | 'FEMALE')}
                    className="sr-only"
                  />
                  <span className={`font-semibold text-base ${watch('requesterGender') === value ? 'text-blue-700' : 'text-gray-900'}`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-gov-label">Nom</label>
              <input
                type="text"
                {...register('requesterLastName')}
                className="form-gov-input"
                placeholder="Nom du demandeur"
              />
            </div>
            <div>
              <label className="form-gov-label">Prénom</label>
              <input
                type="text"
                {...register('requesterFirstName')}
                className="form-gov-input"
                placeholder="Prénom du demandeur"
              />
            </div>
          </div>

          <div>
            <DateSelect
              label="Date de naissance"
              value={watch('requesterBirthDate') || ''}
              onChange={(val) => setValue('requesterBirthDate', val, { shouldValidate: true })}
            />
          </div>
        </div>
      )}

      {/* Coordonnees */}
      <div className="space-y-4">
        <h3 className="form-gov-section-title">Coordonnees</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-gov-label">
              Email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              {...register('email')}
              className={`form-gov-input ${errors.email ? 'form-gov-error' : ''}`}
              placeholder="votre@email.fr"
            />
            {errors.email && (
              <p className="form-gov-error-msg">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="form-gov-label">
              Confirmation email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              {...register('emailConfirm')}
              className={`form-gov-input ${errors.emailConfirm ? 'form-gov-error' : ''}`}
              placeholder="Confirmez votre email"
            />
            {errors.emailConfirm && (
              <p className="form-gov-error-msg">{errors.emailConfirm.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="form-gov-label">
            Telephone <span className="text-red-600">*</span>
          </label>
          <input
            type="tel"
            {...register('telephone')}
            className={`form-gov-input ${errors.telephone ? 'form-gov-error' : ''}`}
            placeholder="06 12 34 56 78"
          />
          <p className="form-gov-hint">De préférence un numéro de portable</p>
          {errors.telephone && (
            <p className="form-gov-error-msg">{errors.telephone.message}</p>
          )}
        </div>
      </div>

      {/* Adresse de livraison */}
      <div className="space-y-4">
        <h3 className="form-gov-section-title">Adresse de livraison</h3>

        <div>
          <label className="form-gov-label">
            Adresse <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            {...register('deliveryAddress.street')}
            className={`form-gov-input ${deliveryErrors?.street ? 'form-gov-error' : ''}`}
            placeholder="Numéro et nom de rue"
          />
          {deliveryErrors?.street && (
            <p className="form-gov-error-msg">{deliveryErrors.street.message}</p>
          )}
        </div>

        <PostalCityAutocomplete
          cpValue={watch('deliveryAddress.zipCode') || ''}
          cityValue={watch('deliveryAddress.city') || ''}
          onCpChange={(value) => setValue('deliveryAddress.zipCode', value, { shouldValidate: true })}
          onCityChange={(value) => setValue('deliveryAddress.city', value, { shouldValidate: true })}
          cpError={deliveryErrors?.zipCode?.message}
          cityError={deliveryErrors?.city?.message}
          required
        />
      </div>
    </div>
  );
}

export default StepRequester;
