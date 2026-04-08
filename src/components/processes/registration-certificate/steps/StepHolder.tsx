// Etape 2: Informations du titulaire de la carte grise

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { PostalCityAutocomplete } from '@/components/forms/PostalCityAutocomplete';
import { OperationType } from '@/types/registration-certificate';
import type { RegistrationCertificateInput } from '@/schemas/registration-certificate';

const CIVILITIES = [
  { value: 'M' as const, label: 'Monsieur' },
  { value: 'MME' as const, label: 'Madame' },
];

const DEPARTMENTS = [
  { value: '01', label: '01 - Ain' }, { value: '02', label: '02 - Aisne' },
  { value: '03', label: '03 - Allier' }, { value: '04', label: '04 - Alpes-de-Haute-Provence' },
  { value: '05', label: '05 - Hautes-Alpes' }, { value: '06', label: '06 - Alpes-Maritimes' },
  { value: '07', label: '07 - Ardeche' }, { value: '08', label: '08 - Ardennes' },
  { value: '09', label: '09 - Ariege' }, { value: '10', label: '10 - Aube' },
  { value: '11', label: '11 - Aude' }, { value: '12', label: '12 - Aveyron' },
  { value: '13', label: '13 - Bouches-du-Rhone' }, { value: '14', label: '14 - Calvados' },
  { value: '15', label: '15 - Cantal' }, { value: '16', label: '16 - Charente' },
  { value: '17', label: '17 - Charente-Maritime' }, { value: '18', label: '18 - Cher' },
  { value: '19', label: '19 - Correze' }, { value: '2A', label: '2A - Corse-du-Sud' },
  { value: '2B', label: '2B - Haute-Corse' }, { value: '21', label: '21 - Cote-d\'Or' },
  { value: '22', label: '22 - Cotes-d\'Armor' }, { value: '23', label: '23 - Creuse' },
  { value: '24', label: '24 - Dordogne' }, { value: '25', label: '25 - Doubs' },
  { value: '26', label: '26 - Drome' }, { value: '27', label: '27 - Eure' },
  { value: '28', label: '28 - Eure-et-Loir' }, { value: '29', label: '29 - Finistere' },
  { value: '30', label: '30 - Gard' }, { value: '31', label: '31 - Haute-Garonne' },
  { value: '32', label: '32 - Gers' }, { value: '33', label: '33 - Gironde' },
  { value: '34', label: '34 - Herault' }, { value: '35', label: '35 - Ille-et-Vilaine' },
  { value: '36', label: '36 - Indre' }, { value: '37', label: '37 - Indre-et-Loire' },
  { value: '38', label: '38 - Isere' }, { value: '39', label: '39 - Jura' },
  { value: '40', label: '40 - Landes' }, { value: '41', label: '41 - Loir-et-Cher' },
  { value: '42', label: '42 - Loire' }, { value: '43', label: '43 - Haute-Loire' },
  { value: '44', label: '44 - Loire-Atlantique' }, { value: '45', label: '45 - Loiret' },
  { value: '46', label: '46 - Lot' }, { value: '47', label: '47 - Lot-et-Garonne' },
  { value: '48', label: '48 - Lozere' }, { value: '49', label: '49 - Maine-et-Loire' },
  { value: '50', label: '50 - Manche' }, { value: '51', label: '51 - Marne' },
  { value: '52', label: '52 - Haute-Marne' }, { value: '53', label: '53 - Mayenne' },
  { value: '54', label: '54 - Meurthe-et-Moselle' }, { value: '55', label: '55 - Meuse' },
  { value: '56', label: '56 - Morbihan' }, { value: '57', label: '57 - Moselle' },
  { value: '58', label: '58 - Nievre' }, { value: '59', label: '59 - Nord' },
  { value: '60', label: '60 - Oise' }, { value: '61', label: '61 - Orne' },
  { value: '62', label: '62 - Pas-de-Calais' }, { value: '63', label: '63 - Puy-de-Dome' },
  { value: '64', label: '64 - Pyrenees-Atlantiques' }, { value: '65', label: '65 - Hautes-Pyrenees' },
  { value: '66', label: '66 - Pyrenees-Orientales' }, { value: '67', label: '67 - Bas-Rhin' },
  { value: '68', label: '68 - Haut-Rhin' }, { value: '69', label: '69 - Rhone' },
  { value: '70', label: '70 - Haute-Saone' }, { value: '71', label: '71 - Saone-et-Loire' },
  { value: '72', label: '72 - Sarthe' }, { value: '73', label: '73 - Savoie' },
  { value: '74', label: '74 - Haute-Savoie' }, { value: '75', label: '75 - Paris' },
  { value: '76', label: '76 - Seine-Maritime' }, { value: '77', label: '77 - Seine-et-Marne' },
  { value: '78', label: '78 - Yvelines' }, { value: '79', label: '79 - Deux-Sevres' },
  { value: '80', label: '80 - Somme' }, { value: '81', label: '81 - Tarn' },
  { value: '82', label: '82 - Tarn-et-Garonne' }, { value: '83', label: '83 - Var' },
  { value: '84', label: '84 - Vaucluse' }, { value: '85', label: '85 - Vendee' },
  { value: '86', label: '86 - Vienne' }, { value: '87', label: '87 - Haute-Vienne' },
  { value: '88', label: '88 - Vosges' }, { value: '89', label: '89 - Yonne' },
  { value: '90', label: '90 - Territoire de Belfort' }, { value: '91', label: '91 - Essonne' },
  { value: '92', label: '92 - Hauts-de-Seine' }, { value: '93', label: '93 - Seine-Saint-Denis' },
  { value: '94', label: '94 - Val-de-Marne' }, { value: '95', label: '95 - Val-d\'Oise' },
  { value: '971', label: '971 - Guadeloupe' }, { value: '972', label: '972 - Martinique' },
  { value: '973', label: '973 - Guyane' }, { value: '974', label: '974 - La Reunion' },
  { value: '976', label: '976 - Mayotte' },
];

export function StepHolder() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<RegistrationCertificateInput>();

  const isCompany = watch('holder.isCompany');
  const operationType = watch('operation.typeId');
  const hasCoOwner = watch('coOwner.hasCoOwner') ?? false;

  const holderErrors = errors.holder as Record<string, { message?: string }> | undefined;

  // Auto-detecter le departement depuis le code postal
  React.useEffect(() => {
    const zipCode = watch('holder.zipCode');
    if (zipCode && zipCode.length === 5) {
      const dept = zipCode.startsWith('20') ? (parseInt(zipCode) < 20200 ? '2A' : '2B') : zipCode.substring(0, zipCode.startsWith('97') ? 3 : 2);
      setValue('holder.departmentCode', dept);
    }
  }, [watch('holder.zipCode')]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Informations du titulaire</h2>
        <p className="form-gov-hint">Personne qui figurera sur la carte grise.</p>
      </div>

      {/* Societe toggle */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700">Le titulaire est :</span>
        <div className="flex gap-3">
          <label className={cn(
            'px-4 py-2 rounded-lg border cursor-pointer transition-colors',
            !isCompany ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
          )}>
            <input type="radio" checked={!isCompany} onChange={() => setValue('holder.isCompany', false)} className="sr-only" />
            Un particulier
          </label>
          <label className={cn(
            'px-4 py-2 rounded-lg border cursor-pointer transition-colors',
            isCompany ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
          )}>
            <input type="radio" checked={isCompany} onChange={() => setValue('holder.isCompany', true)} className="sr-only" />
            Une societe
          </label>
        </div>
      </div>

      {/* Champs societe */}
      {isCompany && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
          <div>
            <label className="form-gov-label">Raison sociale <span className="text-red-600">*</span></label>
            <input type="text" {...register('holder.companyName')} className={`form-gov-input ${holderErrors?.companyName ? 'form-gov-error' : ''}`} placeholder="Ma Societe SAS" />
            {holderErrors?.companyName && <p className="form-gov-error-msg">{holderErrors.companyName.message}</p>}
          </div>
          <div>
            <label className="form-gov-label">SIREN <span className="text-red-600">*</span></label>
            <input type="text" {...register('holder.siren')} className={`form-gov-input ${holderErrors?.siren ? 'form-gov-error' : ''}`} placeholder="123 456 789" />
            {holderErrors?.siren && <p className="form-gov-error-msg">{holderErrors.siren.message}</p>}
          </div>
        </div>
      )}

      {/* Identite */}
      {!isCompany && (
        <div className="space-y-4">
          <h3 className="form-gov-section-title">Identite</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-gov-label">Civilite <span className="text-red-600">*</span></label>
              <div className="flex gap-3">
                {CIVILITIES.map((c) => (
                  <label key={c.value} className={cn(
                    'flex-1 text-center px-3 py-2 rounded-lg border cursor-pointer transition-colors',
                    watch('holder.civility') === c.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  )}>
                    <input type="radio" checked={watch('holder.civility') === c.value} onChange={() => setValue('holder.civility', c.value, { shouldValidate: true })} className="sr-only" />
                    {c.label}
                  </label>
                ))}
              </div>
              {holderErrors?.civility && <p className="form-gov-error-msg">{holderErrors.civility.message}</p>}
            </div>
            <div>
              <label className="form-gov-label">Nom <span className="text-red-600">*</span></label>
              <input type="text" {...register('holder.lastName')} className={`form-gov-input ${holderErrors?.lastName ? 'form-gov-error' : ''}`} />
              {holderErrors?.lastName && <p className="form-gov-error-msg">{holderErrors.lastName.message}</p>}
            </div>
            <div>
              <label className="form-gov-label">Prenom <span className="text-red-600">*</span></label>
              <input type="text" {...register('holder.firstName')} className={`form-gov-input ${holderErrors?.firstName ? 'form-gov-error' : ''}`} />
              {holderErrors?.firstName && <p className="form-gov-error-msg">{holderErrors.firstName.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-gov-label">Date de naissance <span className="text-red-600">*</span></label>
              <input type="date" {...register('holder.birthDate')} className={`form-gov-input ${holderErrors?.birthDate ? 'form-gov-error' : ''}`} />
              {holderErrors?.birthDate && <p className="form-gov-error-msg">{holderErrors.birthDate.message}</p>}
            </div>
            <div>
              <label className="form-gov-label">Lieu de naissance <span className="text-red-600">*</span></label>
              <input type="text" {...register('holder.birthCityName')} className={`form-gov-input ${holderErrors?.birthCityName ? 'form-gov-error' : ''}`} placeholder="Paris" />
              {holderErrors?.birthCityName && <p className="form-gov-error-msg">{holderErrors.birthCityName.message}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Adresse */}
      <div className="space-y-4">
        <h3 className="form-gov-section-title">Adresse du titulaire</h3>
        <div>
          <label className="form-gov-label">Adresse <span className="text-red-600">*</span></label>
          <input type="text" {...register('holder.address')} className={`form-gov-input ${holderErrors?.address ? 'form-gov-error' : ''}`} placeholder="Numero et nom de rue" />
          {holderErrors?.address && <p className="form-gov-error-msg">{holderErrors.address.message}</p>}
        </div>
        <div>
          <label className="form-gov-label">Complement d'adresse</label>
          <input type="text" {...register('holder.additionalAddress')} className="form-gov-input" placeholder="Batiment, etage..." />
        </div>
        <PostalCityAutocomplete
          cpValue={watch('holder.zipCode') || ''}
          cityValue={watch('holder.city') || ''}
          onCpChange={(value) => setValue('holder.zipCode', value, { shouldValidate: true })}
          onCityChange={(value) => setValue('holder.city', value, { shouldValidate: true })}
          cpError={holderErrors?.zipCode?.message}
          cityError={holderErrors?.city?.message}
          required
        />
        <div>
          <label className="form-gov-label">Departement <span className="text-red-600">*</span></label>
          <select {...register('holder.departmentCode')} className={`form-gov-input ${holderErrors?.departmentCode ? 'form-gov-error' : ''}`}>
            <option value="">Selectionnez un departement</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <p className="form-gov-hint">Utilise pour le calcul de la taxe regionale</p>
          {holderErrors?.departmentCode && <p className="form-gov-error-msg">{holderErrors.departmentCode.message}</p>}
        </div>
      </div>

      {/* Co-titulaire (seulement changement titulaire) */}
      {operationType === OperationType.CHANGEMENT_TITULAIRE && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-gray-900">Co-titulaire</h3>
              <p className="text-sm text-gray-500">Ajouter un co-titulaire sur la carte grise (conjoint, associe...)</p>
            </div>
            <button
              type="button"
              onClick={() => setValue('coOwner.hasCoOwner', !hasCoOwner)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                hasCoOwner
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              )}
            >
              {hasCoOwner ? 'Supprimer' : 'Ajouter'}
            </button>
          </div>

          {hasCoOwner && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="form-gov-label">Nom</label>
                <input type="text" {...register('coOwner.lastName')} className="form-gov-input" />
              </div>
              <div>
                <label className="form-gov-label">Prenom</label>
                <input type="text" {...register('coOwner.firstName')} className="form-gov-input" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StepHolder;
