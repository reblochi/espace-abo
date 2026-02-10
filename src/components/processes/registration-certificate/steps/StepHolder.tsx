// Etape 3: Informations du titulaire

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { RegistrationCertificateInput } from '@/schemas/registration-certificate';

const CIVILITIES = [
  { value: 'M', label: 'Monsieur' },
  { value: 'MME', label: 'Madame' },
];

const DEPARTMENTS = [
  { value: '01', label: '01 - Ain' },
  { value: '02', label: '02 - Aisne' },
  { value: '03', label: '03 - Allier' },
  { value: '04', label: '04 - Alpes-de-Haute-Provence' },
  { value: '05', label: '05 - Hautes-Alpes' },
  { value: '06', label: '06 - Alpes-Maritimes' },
  { value: '07', label: '07 - Ardeche' },
  { value: '08', label: '08 - Ardennes' },
  { value: '09', label: '09 - Ariege' },
  { value: '10', label: '10 - Aube' },
  { value: '11', label: '11 - Aude' },
  { value: '12', label: '12 - Aveyron' },
  { value: '13', label: '13 - Bouches-du-Rhone' },
  { value: '14', label: '14 - Calvados' },
  { value: '15', label: '15 - Cantal' },
  { value: '16', label: '16 - Charente' },
  { value: '17', label: '17 - Charente-Maritime' },
  { value: '18', label: '18 - Cher' },
  { value: '19', label: '19 - Correze' },
  { value: '21', label: '21 - Cote-d\'Or' },
  { value: '22', label: '22 - Cotes-d\'Armor' },
  { value: '23', label: '23 - Creuse' },
  { value: '24', label: '24 - Dordogne' },
  { value: '25', label: '25 - Doubs' },
  { value: '26', label: '26 - Drome' },
  { value: '27', label: '27 - Eure' },
  { value: '28', label: '28 - Eure-et-Loir' },
  { value: '29', label: '29 - Finistere' },
  { value: '2A', label: '2A - Corse-du-Sud' },
  { value: '2B', label: '2B - Haute-Corse' },
  { value: '30', label: '30 - Gard' },
  { value: '31', label: '31 - Haute-Garonne' },
  { value: '32', label: '32 - Gers' },
  { value: '33', label: '33 - Gironde' },
  { value: '34', label: '34 - Herault' },
  { value: '35', label: '35 - Ille-et-Vilaine' },
  { value: '36', label: '36 - Indre' },
  { value: '37', label: '37 - Indre-et-Loire' },
  { value: '38', label: '38 - Isere' },
  { value: '39', label: '39 - Jura' },
  { value: '40', label: '40 - Landes' },
  { value: '41', label: '41 - Loir-et-Cher' },
  { value: '42', label: '42 - Loire' },
  { value: '43', label: '43 - Haute-Loire' },
  { value: '44', label: '44 - Loire-Atlantique' },
  { value: '45', label: '45 - Loiret' },
  { value: '46', label: '46 - Lot' },
  { value: '47', label: '47 - Lot-et-Garonne' },
  { value: '48', label: '48 - Lozere' },
  { value: '49', label: '49 - Maine-et-Loire' },
  { value: '50', label: '50 - Manche' },
  { value: '51', label: '51 - Marne' },
  { value: '52', label: '52 - Haute-Marne' },
  { value: '53', label: '53 - Mayenne' },
  { value: '54', label: '54 - Meurthe-et-Moselle' },
  { value: '55', label: '55 - Meuse' },
  { value: '56', label: '56 - Morbihan' },
  { value: '57', label: '57 - Moselle' },
  { value: '58', label: '58 - Nievre' },
  { value: '59', label: '59 - Nord' },
  { value: '60', label: '60 - Oise' },
  { value: '61', label: '61 - Orne' },
  { value: '62', label: '62 - Pas-de-Calais' },
  { value: '63', label: '63 - Puy-de-Dome' },
  { value: '64', label: '64 - Pyrenees-Atlantiques' },
  { value: '65', label: '65 - Hautes-Pyrenees' },
  { value: '66', label: '66 - Pyrenees-Orientales' },
  { value: '67', label: '67 - Bas-Rhin' },
  { value: '68', label: '68 - Haut-Rhin' },
  { value: '69', label: '69 - Rhone' },
  { value: '70', label: '70 - Haute-Saone' },
  { value: '71', label: '71 - Saone-et-Loire' },
  { value: '72', label: '72 - Sarthe' },
  { value: '73', label: '73 - Savoie' },
  { value: '74', label: '74 - Haute-Savoie' },
  { value: '75', label: '75 - Paris' },
  { value: '76', label: '76 - Seine-Maritime' },
  { value: '77', label: '77 - Seine-et-Marne' },
  { value: '78', label: '78 - Yvelines' },
  { value: '79', label: '79 - Deux-Sevres' },
  { value: '80', label: '80 - Somme' },
  { value: '81', label: '81 - Tarn' },
  { value: '82', label: '82 - Tarn-et-Garonne' },
  { value: '83', label: '83 - Var' },
  { value: '84', label: '84 - Vaucluse' },
  { value: '85', label: '85 - Vendee' },
  { value: '86', label: '86 - Vienne' },
  { value: '87', label: '87 - Haute-Vienne' },
  { value: '88', label: '88 - Vosges' },
  { value: '89', label: '89 - Yonne' },
  { value: '90', label: '90 - Territoire de Belfort' },
  { value: '91', label: '91 - Essonne' },
  { value: '92', label: '92 - Hauts-de-Seine' },
  { value: '93', label: '93 - Seine-Saint-Denis' },
  { value: '94', label: '94 - Val-de-Marne' },
  { value: '95', label: '95 - Val-d\'Oise' },
  { value: '971', label: '971 - Guadeloupe' },
  { value: '972', label: '972 - Martinique' },
  { value: '973', label: '973 - Guyane' },
  { value: '974', label: '974 - La Reunion' },
  { value: '976', label: '976 - Mayotte' },
];

export function StepHolder() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RegistrationCertificateInput>();

  const isClaimerHolder = watch('claimer.isHolder');
  const isCompany = watch('holder.isCompany');
  const hasCoOwner = watch('coOwner') !== undefined;

  // Copier les infos du demandeur si c'est le titulaire
  React.useEffect(() => {
    if (isClaimerHolder) {
      const claimer = watch('claimer');
      setValue('holder.civility', claimer.civility);
      setValue('holder.lastName', claimer.lastName);
      setValue('holder.firstName', claimer.firstName);
      setValue('holder.birthDate', claimer.birthDate);
      setValue('holder.birthPlace', claimer.birthPlace);
    }
  }, [isClaimerHolder, watch, setValue]);

  return (
    <div className="space-y-6">
      {/* Type de titulaire */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700">
          Le titulaire est :
        </span>
        <div className="flex gap-3">
          <label className={cn(
            'px-4 py-2 rounded-lg border cursor-pointer transition-colors',
            !isCompany ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
          )}>
            <input
              type="radio"
              checked={!isCompany}
              onChange={() => setValue('holder.isCompany', false)}
              className="sr-only"
            />
            Un particulier
          </label>
          <label className={cn(
            'px-4 py-2 rounded-lg border cursor-pointer transition-colors',
            isCompany ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
          )}>
            <input
              type="radio"
              checked={isCompany}
              onChange={() => setValue('holder.isCompany', true)}
              className="sr-only"
            />
            Une societe
          </label>
        </div>
      </div>

      {/* Informations societe */}
      {isCompany && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Raison sociale *
            </label>
            <Input
              {...register('holder.companyName')}
              error={errors.holder?.companyName?.message}
              placeholder="Ma Societe SAS"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SIRET *
            </label>
            <Input
              {...register('holder.siret')}
              error={errors.holder?.siret?.message}
              placeholder="123 456 789 00012"
            />
          </div>
        </div>
      )}

      {/* Informations du titulaire */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!isCompany && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Civilite *
              </label>
              <Select
                {...register('holder.civility')}
                error={errors.holder?.civility?.message}
                disabled={isClaimerHolder}
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
                {...register('holder.lastName')}
                error={errors.holder?.lastName?.message}
                disabled={isClaimerHolder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prenom *
              </label>
              <Input
                {...register('holder.firstName')}
                error={errors.holder?.firstName?.message}
                disabled={isClaimerHolder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de naissance *
              </label>
              <Input
                type="date"
                {...register('holder.birthDate')}
                error={errors.holder?.birthDate?.message}
                disabled={isClaimerHolder}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lieu de naissance *
              </label>
              <Input
                {...register('holder.birthPlace')}
                error={errors.holder?.birthPlace?.message}
                disabled={isClaimerHolder}
              />
            </div>
          </>
        )}

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adresse *
          </label>
          <Input
            {...register('holder.address')}
            error={errors.holder?.address?.message}
            placeholder="123 rue de la Republique"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Code postal *
          </label>
          <Input
            {...register('holder.postalCode')}
            error={errors.holder?.postalCode?.message}
            placeholder="75001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ville *
          </label>
          <Input
            {...register('holder.city')}
            error={errors.holder?.city?.message}
            placeholder="Paris"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Departement * (pour le calcul de la taxe regionale)
          </label>
          <Select
            {...register('holder.departmentCode')}
            error={errors.holder?.departmentCode?.message}
          >
            <option value="">Selectionnez un departement</option>
            {DEPARTMENTS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Co-titulaire */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-medium text-gray-900">Co-titulaire</h4>
            <p className="text-sm text-gray-500">
              Ajouter un co-titulaire sur la carte grise (conjoint, associe...)
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (hasCoOwner) {
                setValue('coOwner', undefined);
              } else {
                setValue('coOwner', { civility: 'M' });
              }
            }}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Civilite
              </label>
              <Select {...register('coOwner.civility')}>
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
                Nom
              </label>
              <Input {...register('coOwner.lastName')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prenom
              </label>
              <Input {...register('coOwner.firstName')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de naissance
              </label>
              <Input type="date" {...register('coOwner.birthDate')} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lieu de naissance
              </label>
              <Input {...register('coOwner.birthPlace')} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StepHolder;
