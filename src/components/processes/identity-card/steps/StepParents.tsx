// Etape 3: Informations des parents

'use client';

import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { useCountries } from '@/hooks/useCountries';
import type { IdentityCardInput } from '@/schemas/identity-card';

const inputClass = 'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const errorInputClass = 'border-red-500 focus:ring-red-500';

export function StepParents() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<IdentityCardInput>();

  const { countries } = useCountries();
  const fatherUnknown = watch('fatherUnknown');
  const motherUnknown = watch('motherUnknown');

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 mb-2">
        Renseignez les informations de vos parents telles qu'elles figurent sur votre acte de naissance.
      </p>

      {/* Pere */}
      <div className="p-4 bg-gray-50 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Pere</h4>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={fatherUnknown}
              onChange={(e) => {
                setValue('fatherUnknown', e.target.checked, { shouldValidate: true });
                if (e.target.checked) {
                  setValue('fatherLastName', '');
                  setValue('fatherFirstName', '');
                  setValue('fatherBirthDate', '');
                  setValue('fatherNationalityId', undefined);
                  setValue('fatherBirthCity', '');
                }
              }}
              className="rounded border-gray-300"
            />
            Pere inconnu
          </label>
        </div>

        {!fatherUnknown && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('fatherLastName')}
                  className={cn(inputClass, errors.fatherLastName && errorInputClass)}
                  placeholder="Nom du pere"
                />
                {errors.fatherLastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fatherLastName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prenom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('fatherFirstName')}
                  className={cn(inputClass, errors.fatherFirstName && errorInputClass)}
                  placeholder="Prenom du pere"
                />
                {errors.fatherFirstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fatherFirstName.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de naissance
                </label>
                <input
                  type="date"
                  {...register('fatherBirthDate')}
                  className={cn(inputClass, errors.fatherBirthDate && errorInputClass)}
                />
                {errors.fatherBirthDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.fatherBirthDate.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nationalite du pere
                </label>
                <select
                  {...register('fatherNationalityId', { valueAsNumber: true })}
                  className={inputClass}
                >
                  <option value="">Francais</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville de naissance <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('fatherBirthCity')}
                className={cn(inputClass, errors.fatherBirthCity && errorInputClass)}
                placeholder="Ville de naissance du pere"
              />
              {errors.fatherBirthCity && (
                <p className="mt-1 text-sm text-red-600">{errors.fatherBirthCity.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mere */}
      <div className="p-4 bg-gray-50 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Mere</h4>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={motherUnknown}
              onChange={(e) => {
                setValue('motherUnknown', e.target.checked, { shouldValidate: true });
                if (e.target.checked) {
                  setValue('motherLastName', '');
                  setValue('motherFirstName', '');
                  setValue('motherBirthDate', '');
                  setValue('motherNationalityId', undefined);
                  setValue('motherBirthCity', '');
                }
              }}
              className="rounded border-gray-300"
            />
            Mere inconnue
          </label>
        </div>

        {!motherUnknown && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de jeune fille <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('motherLastName')}
                  className={cn(inputClass, errors.motherLastName && errorInputClass)}
                  placeholder="Nom de la mere"
                />
                {errors.motherLastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.motherLastName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prenom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('motherFirstName')}
                  className={cn(inputClass, errors.motherFirstName && errorInputClass)}
                  placeholder="Prenom de la mere"
                />
                {errors.motherFirstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.motherFirstName.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de naissance
                </label>
                <input
                  type="date"
                  {...register('motherBirthDate')}
                  className={cn(inputClass, errors.motherBirthDate && errorInputClass)}
                />
                {errors.motherBirthDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.motherBirthDate.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nationalite de la mere
                </label>
                <select
                  {...register('motherNationalityId', { valueAsNumber: true })}
                  className={inputClass}
                >
                  <option value="">Francaise</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville de naissance <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('motherBirthCity')}
                className={cn(inputClass, errors.motherBirthCity && errorInputClass)}
                placeholder="Ville de naissance de la mere"
              />
              {errors.motherBirthCity && (
                <p className="mt-1 text-sm text-red-600">{errors.motherBirthCity.message}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Erreur : les deux parents inconnus */}
      {fatherUnknown && motherUnknown && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            Les deux parents ne peuvent pas etre inconnus simultanement.
            Au moins un parent doit etre renseigne.
          </p>
        </div>
      )}
    </div>
  );
}

export default StepParents;
