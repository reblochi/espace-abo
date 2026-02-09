// Etape 2: Informations du demandeur

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { RegistrationCertificateInput } from '@/schemas/registration-certificate';

const CIVILITIES = [
  { value: 1, label: 'Monsieur' },
  { value: 2, label: 'Madame' },
];

export function StepClaimer() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RegistrationCertificateInput>();

  const isHolder = watch('claimer.isHolder');

  return (
    <div className="space-y-6">
      {/* Est-ce le titulaire ? */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700">
          Etes-vous le futur titulaire de la carte grise ?
        </span>
        <div className="flex gap-3">
          <label className={cn(
            'px-4 py-2 rounded-lg border cursor-pointer transition-colors',
            isHolder ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
          )}>
            <input
              type="radio"
              {...register('claimer.isHolder')}
              value="true"
              checked={isHolder === true}
              onChange={() => setValue('claimer.isHolder', true)}
              className="sr-only"
            />
            Oui
          </label>
          <label className={cn(
            'px-4 py-2 rounded-lg border cursor-pointer transition-colors',
            isHolder === false ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
          )}>
            <input
              type="radio"
              {...register('claimer.isHolder')}
              value="false"
              checked={isHolder === false}
              onChange={() => setValue('claimer.isHolder', false)}
              className="sr-only"
            />
            Non
          </label>
        </div>
      </div>

      {/* Informations du demandeur */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Civilite *
          </label>
          <Select
            {...register('claimer.civility', { valueAsNumber: true })}
            error={errors.claimer?.civility?.message}
          >
            <option value="">Selectionnez</option>
            {CIVILITIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom *
          </label>
          <Input
            {...register('claimer.lastName')}
            error={errors.claimer?.lastName?.message}
            placeholder="Dupont"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prenom *
          </label>
          <Input
            {...register('claimer.firstName')}
            error={errors.claimer?.firstName?.message}
            placeholder="Jean"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de naissance *
          </label>
          <Input
            type="date"
            {...register('claimer.birthDate')}
            error={errors.claimer?.birthDate?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lieu de naissance *
          </label>
          <Input
            {...register('claimer.birthPlace')}
            error={errors.claimer?.birthPlace?.message}
            placeholder="Paris"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <Input
            type="email"
            {...register('claimer.email')}
            error={errors.claimer?.email?.message}
            placeholder="jean.dupont@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telephone *
          </label>
          <Input
            type="tel"
            {...register('claimer.phone')}
            error={errors.claimer?.phone?.message}
            placeholder="06 12 34 56 78"
          />
        </div>
      </div>

      {/* Mandat si demandeur != titulaire */}
      {isHolder === false && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-medium text-amber-800">Mandat obligatoire</h4>
              <p className="text-sm text-amber-700 mt-1">
                Si vous effectuez cette demarche pour le compte d'une autre personne,
                vous devrez fournir un mandat signe par le futur titulaire.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lien avec le titulaire
              </label>
              <Input
                {...register('claimer.relationToHolder')}
                placeholder="Conjoint, parent, mandataire..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StepClaimer;
