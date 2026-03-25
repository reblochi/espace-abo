// Etape 4: Demandeur et adresse de livraison

'use client';

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { genderLabels } from '@/types/identity-card';
import type { IdentityCardInput } from '@/schemas/identity-card';

const inputClass = 'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const errorInputClass = 'border-red-500 focus:ring-red-500';

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
      {/* Checkbox titulaire */}
      <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300">
        <input
          type="checkbox"
          checked={isTitulaire}
          onChange={(e) => setValue('isTitulaire', e.target.checked)}
          className="rounded border-gray-300"
        />
        <span className="text-sm text-gray-700">
          Je suis le titulaire de la carte d'identite
        </span>
      </label>

      {/* Infos demandeur (si different du titulaire) */}
      {!isTitulaire && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-900 text-sm">Informations du demandeur</h4>
          <p className="text-xs text-gray-500">
            Si le titulaire est mineur, renseignez les informations du representant legal.
          </p>

          {/* Civilite demandeur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Civilite</label>
            <div className="flex gap-3">
              {(Object.entries(genderLabels) as [string, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('requesterGender', value as 'MALE' | 'FEMALE')}
                  className={cn(
                    'px-4 py-1.5 rounded-lg border-2 text-sm font-medium transition-all',
                    watch('requesterGender') === value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                {...register('requesterLastName')}
                className={inputClass}
                placeholder="Nom du demandeur"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prenom</label>
              <input
                type="text"
                {...register('requesterFirstName')}
                className={inputClass}
                placeholder="Prenom du demandeur"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
            <input
              type="date"
              {...register('requesterBirthDate')}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Coordonnees */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 text-sm">Coordonnees</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              {...register('email')}
              className={cn(inputClass, errors.email && errorInputClass)}
              placeholder="votre@email.fr"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmation email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              {...register('emailConfirm')}
              className={cn(inputClass, errors.emailConfirm && errorInputClass)}
              placeholder="Confirmez votre email"
            />
            {errors.emailConfirm && (
              <p className="mt-1 text-sm text-red-600">{errors.emailConfirm.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telephone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            {...register('telephone')}
            className={cn(inputClass, errors.telephone && errorInputClass)}
            placeholder="06 12 34 56 78"
          />
          {errors.telephone && (
            <p className="mt-1 text-sm text-red-600">{errors.telephone.message}</p>
          )}
        </div>
      </div>

      {/* Adresse de livraison */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900 text-sm">Adresse de livraison</h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adresse <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('deliveryAddress.street')}
            className={cn(inputClass, deliveryErrors?.street && errorInputClass)}
            placeholder="Numero et nom de rue"
          />
          {deliveryErrors?.street && (
            <p className="mt-1 text-sm text-red-600">{deliveryErrors.street.message}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code postal <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('deliveryAddress.zipCode')}
              className={cn(inputClass, deliveryErrors?.zipCode && errorInputClass)}
              placeholder="75001"
              maxLength={5}
            />
            {deliveryErrors?.zipCode && (
              <p className="mt-1 text-sm text-red-600">{deliveryErrors.zipCode.message}</p>
            )}
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ville <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('deliveryAddress.city')}
              className={cn(inputClass, deliveryErrors?.city && errorInputClass)}
              placeholder="Paris"
            />
            {deliveryErrors?.city && (
              <p className="mt-1 text-sm text-red-600">{deliveryErrors.city.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StepRequester;
