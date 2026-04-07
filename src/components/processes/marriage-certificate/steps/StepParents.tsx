// Etape 3: Parents de l'epoux 1 + lien avec le beneficiaire
// Affichee uniquement pour copie_integrale et extrait_filiation

'use client';

import { useFormContext } from 'react-hook-form';
import { claimerTypeLabels } from '@/types/birth-certificate';
import type { MarriageCertificateInput } from '@/schemas/marriage-certificate';

export function StepParents() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<MarriageCertificateInput>();
  const selectedClaimerType = watch('claimerType');
  const fatherUnknown = watch('fatherUnknown');
  const motherUnknown = watch('motherUnknown');

  return (
    <div className="space-y-6">
      {/* Lien avec le beneficiaire */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Votre lien avec les epoux
        </h2>
        <p className="form-gov-hint">
          Quel est votre lien avec les personnes concernees par l'acte ?
        </p>
      </div>

      <div className="space-y-2">
        {(Object.entries(claimerTypeLabels) as [string, string][]).map(([value, label]) => (
          <label
            key={value}
            onClick={() => setValue('claimerType', value as MarriageCertificateInput['claimerType'], { shouldValidate: true })}
            className={`
              flex items-center p-4 cursor-pointer transition-colors duration-150 border-l-4
              ${selectedClaimerType === value
                ? 'bg-blue-50 border-l-blue-700'
                : 'bg-gray-50 border-l-transparent hover:bg-blue-50/50'
              }
            `}
          >
            <input
              type="radio"
              value={value}
              checked={selectedClaimerType === value}
              onChange={() => setValue('claimerType', value as MarriageCertificateInput['claimerType'], { shouldValidate: true })}
              className="sr-only"
            />
            <div className={`
              w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0
              ${selectedClaimerType === value ? 'border-blue-700' : 'border-gray-500'}
            `}>
              {selectedClaimerType === value && (
                <div className="w-3 h-3 rounded-full bg-blue-700" />
              )}
            </div>
            <span className={`text-base ${selectedClaimerType === value ? 'font-semibold text-gray-900' : 'text-gray-900'}`}>
              {label}
            </span>
          </label>
        ))}
      </div>
      {errors.claimerType && (
        <p className="form-gov-error-msg">{errors.claimerType.message}</p>
      )}

      {/* Parents de l'epoux 1 */}
      <div className="space-y-6 border-t border-gray-200 pt-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Parents de l'epoux(se) 1
          </h2>
          <p className="form-gov-hint">
            Requises pour une copie integrale ou un extrait avec filiation.
          </p>
        </div>

        {/* Pere */}
        <div className="space-y-4">
          <h3 className="form-gov-section-title">Pere</h3>

          <div className={`form-gov-checkbox-group ${fatherUnknown ? 'checked' : ''} ${fatherUnknown && motherUnknown ? 'border-2 border-red-600' : ''}`}>
            <input
              type="checkbox"
              id="fatherUnknown"
              checked={fatherUnknown}
              onChange={(e) => {
                setValue('fatherUnknown', e.target.checked, { shouldValidate: true });
                if (e.target.checked) {
                  setValue('fatherFirstName', '');
                  setValue('fatherLastName', '');
                }
              }}
            />
            <label htmlFor="fatherUnknown">Pere inconnu ou non mentionne sur l'acte</label>
          </div>

          {!fatherUnknown && (
            <div className="space-y-4 p-4 bg-gray-50">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="form-gov-label">
                    Prenom du pere <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('fatherFirstName')}
                    className={`form-gov-input ${errors.fatherFirstName ? 'form-gov-error' : ''}`}
                  />
                  {errors.fatherFirstName && (
                    <p className="form-gov-error-msg">{errors.fatherFirstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="form-gov-label">
                    Nom du pere <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('fatherLastName')}
                    className={`form-gov-input ${errors.fatherLastName ? 'form-gov-error' : ''}`}
                  />
                  {errors.fatherLastName && (
                    <p className="form-gov-error-msg">{errors.fatherLastName.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mere */}
        <div className="space-y-4">
          <h3 className="form-gov-section-title">Mere</h3>

          <div className={`form-gov-checkbox-group ${motherUnknown ? 'checked' : ''} ${fatherUnknown && motherUnknown ? 'border-2 border-red-600' : ''}`}>
            <input
              type="checkbox"
              id="motherUnknown"
              checked={motherUnknown}
              onChange={(e) => {
                setValue('motherUnknown', e.target.checked, { shouldValidate: true });
                if (e.target.checked) {
                  setValue('motherFirstName', '');
                  setValue('motherLastName', '');
                }
              }}
            />
            <label htmlFor="motherUnknown">Mere inconnue ou non mentionnee sur l'acte</label>
          </div>

          {!motherUnknown && (
            <div className="space-y-4 p-4 bg-gray-50">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="form-gov-label">
                    Prenom de la mere <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('motherFirstName')}
                    className={`form-gov-input ${errors.motherFirstName ? 'form-gov-error' : ''}`}
                  />
                  {errors.motherFirstName && (
                    <p className="form-gov-error-msg">{errors.motherFirstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="form-gov-label">
                    Nom de la mere <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('motherLastName')}
                    className={`form-gov-input ${errors.motherLastName ? 'form-gov-error' : ''}`}
                  />
                  {errors.motherLastName && (
                    <p className="form-gov-error-msg">{errors.motherLastName.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Erreur : les deux parents inconnus */}
        {fatherUnknown && motherUnknown && (
          <div className="p-4 bg-red-50 border-l-4 border-l-red-600">
            <p className="text-base text-red-800 font-semibold">
              Les deux parents ne peuvent pas etre inconnus simultanement.
              Au moins un parent doit etre renseigne.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StepParents;
