// Etape 2: Identite du titulaire de la carte d'identité

'use client';

import { useFormContext } from 'react-hook-form';
import {
  genderLabels,
  UsageNameType,
  usageNameTypeLabels,
  AdditionalNameWord,
  additionalNameWordLabels,
} from '@/types/identity-card';
import type { IdentityCardInput } from '@/schemas/identity-card';

export function StepIdentity() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<IdentityCardInput>();
  const selectedGender = watch('gender');
  const nomUsage = watch('nomUsage');
  const hasNomUsage = !!nomUsage && nomUsage.trim().length > 0;

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

      {/* Prénom(s) */}
      <div className="mb-6">
        <label className="form-gov-label">
          Prénom(s) <span className="text-red-600">*</span>
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
    </div>
  );
}

export default StepIdentity;
