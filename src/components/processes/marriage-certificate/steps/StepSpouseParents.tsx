// Etape 5: Parents du conjoint (Epoux 2)
// Affichee uniquement pour copie_integrale et extrait_filiation

'use client';

import { useFormContext } from 'react-hook-form';
import type { MarriageCertificateInput } from '@/schemas/marriage-certificate';

export function StepSpouseParents() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<MarriageCertificateInput>();
  const spouseFatherUnknown = watch('spouseFatherUnknown');
  const spouseMotherUnknown = watch('spouseMotherUnknown');

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Parents de l'epoux(se) 2
        </h2>
        <p className="form-gov-hint">
          Requises pour une copie integrale ou un extrait avec filiation.
        </p>
      </div>

      {/* Pere du conjoint */}
      <div className="space-y-4">
        <h3 className="form-gov-section-title">Pere</h3>

        <div className={`form-gov-checkbox-group ${spouseFatherUnknown ? 'checked' : ''} ${spouseFatherUnknown && spouseMotherUnknown ? 'border-2 border-red-600' : ''}`}>
          <input
            type="checkbox"
            id="spouseFatherUnknown"
            checked={spouseFatherUnknown}
            onChange={(e) => {
              setValue('spouseFatherUnknown', e.target.checked, { shouldValidate: true });
              if (e.target.checked) {
                setValue('spouseFatherFirstName', '');
                setValue('spouseFatherLastName', '');
              }
            }}
          />
          <label htmlFor="spouseFatherUnknown">Pere inconnu ou non mentionne sur l'acte</label>
        </div>

        {!spouseFatherUnknown && (
          <div className="space-y-4 p-4 bg-gray-50">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-gov-label">
                  Prenom du pere <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  {...register('spouseFatherFirstName')}
                  className={`form-gov-input ${errors.spouseFatherFirstName ? 'form-gov-error' : ''}`}
                />
                {errors.spouseFatherFirstName && (
                  <p className="form-gov-error-msg">{errors.spouseFatherFirstName.message}</p>
                )}
              </div>
              <div>
                <label className="form-gov-label">
                  Nom du pere <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  {...register('spouseFatherLastName')}
                  className={`form-gov-input ${errors.spouseFatherLastName ? 'form-gov-error' : ''}`}
                />
                {errors.spouseFatherLastName && (
                  <p className="form-gov-error-msg">{errors.spouseFatherLastName.message}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mere du conjoint */}
      <div className="space-y-4">
        <h3 className="form-gov-section-title">Mere</h3>

        <div className={`form-gov-checkbox-group ${spouseMotherUnknown ? 'checked' : ''} ${spouseFatherUnknown && spouseMotherUnknown ? 'border-2 border-red-600' : ''}`}>
          <input
            type="checkbox"
            id="spouseMotherUnknown"
            checked={spouseMotherUnknown}
            onChange={(e) => {
              setValue('spouseMotherUnknown', e.target.checked, { shouldValidate: true });
              if (e.target.checked) {
                setValue('spouseMotherFirstName', '');
                setValue('spouseMotherLastName', '');
              }
            }}
          />
          <label htmlFor="spouseMotherUnknown">Mere inconnue ou non mentionnee sur l'acte</label>
        </div>

        {!spouseMotherUnknown && (
          <div className="space-y-4 p-4 bg-gray-50">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-gov-label">
                  Prenom de la mere <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  {...register('spouseMotherFirstName')}
                  className={`form-gov-input ${errors.spouseMotherFirstName ? 'form-gov-error' : ''}`}
                />
                {errors.spouseMotherFirstName && (
                  <p className="form-gov-error-msg">{errors.spouseMotherFirstName.message}</p>
                )}
              </div>
              <div>
                <label className="form-gov-label">
                  Nom de la mere <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  {...register('spouseMotherLastName')}
                  className={`form-gov-input ${errors.spouseMotherLastName ? 'form-gov-error' : ''}`}
                />
                {errors.spouseMotherLastName && (
                  <p className="form-gov-error-msg">{errors.spouseMotherLastName.message}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Erreur : les deux parents inconnus */}
      {spouseFatherUnknown && spouseMotherUnknown && (
        <div className="p-4 bg-red-50 border-l-4 border-l-red-600">
          <p className="text-base text-red-800 font-semibold">
            Les deux parents ne peuvent pas etre inconnus simultanement.
            Au moins un parent doit etre renseigne.
          </p>
        </div>
      )}
    </div>
  );
}

export default StepSpouseParents;
