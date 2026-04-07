// Etape 4: Demandeur et adresse de livraison
// Utilise SharedStepRequester pour les coordonnees/adresse (meme UI que les actes d'etat civil)
// + section specifique CNI pour titulaire/representant legal

'use client';

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { genderLabels } from '@/types/identity-card';
import { DateSelect } from '@/components/forms';
import { SharedStepRequester } from '@/components/processes/shared/StepRequester';
import type { IdentityCardInput } from '@/schemas/identity-card';

export function StepRequester() {
  const { watch, setValue } = useFormContext<IdentityCardInput>();

  const isTitulaire = watch('isTitulaire');

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
      <div className={`form-gov-checkbox-group ${isTitulaire ? 'checked' : ''}`}>
        <input
          type="checkbox"
          id="isTitulaire"
          checked={isTitulaire}
          onChange={(e) => setValue('isTitulaire', e.target.checked)}
        />
        <label htmlFor="isTitulaire">
          Je suis le titulaire de la carte d'identite
        </label>
      </div>

      {/* Infos demandeur (si different du titulaire) */}
      {!isTitulaire && (
        <div className="p-4 bg-gray-50 space-y-4">
          <h3 className="form-gov-section-title">Informations du representant legal</h3>
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
                value={watch('requesterLastName') || ''}
                onChange={(e) => setValue('requesterLastName', e.target.value)}
                className="form-gov-input"
              />
            </div>
            <div>
              <label className="form-gov-label">Prenom</label>
              <input
                type="text"
                value={watch('requesterFirstName') || ''}
                onChange={(e) => setValue('requesterFirstName', e.target.value)}
                className="form-gov-input"
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

      {/* Coordonnees + adresse de livraison (composant partage) */}
      <SharedStepRequester hideIdentity />
    </div>
  );
}

export default StepRequester;
