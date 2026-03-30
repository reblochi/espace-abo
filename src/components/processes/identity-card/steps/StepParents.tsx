// Etape 3: Informations des parents

'use client';

import { useFormContext } from 'react-hook-form';
import { useCountries } from '@/hooks/useCountries';
import type { IdentityCardInput } from '@/schemas/identity-card';

export function StepParents() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<IdentityCardInput>();

  const { countries } = useCountries();
  const fatherUnknown = watch('fatherUnknown');
  const motherUnknown = watch('motherUnknown');

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Informations sur vos parents
        </h2>
        <p className="form-gov-hint">
          Renseignez les informations de vos parents telles qu'elles figurent sur votre acte de naissance.
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
                setValue('fatherLastName', '');
                setValue('fatherFirstName', '');
                setValue('fatherBirthDate', '');
                setValue('fatherNationalityId', undefined);
                setValue('fatherBirthCity', '');
              }
            }}
          />
          <label htmlFor="fatherUnknown">Pere inconnu ou non mentionne sur l'acte de naissance</label>
        </div>

        {!fatherUnknown && (
          <div className="space-y-4 p-4 bg-gray-50">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-gov-label">
                  Nom <span className="text-red-600">*</span>
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
              <div>
                <label className="form-gov-label">
                  Prenom <span className="text-red-600">*</span>
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
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-gov-label">
                  Date de naissance
                </label>
                <input
                  type="date"
                  {...register('fatherBirthDate')}
                  className={`form-gov-input ${errors.fatherBirthDate ? 'form-gov-error' : ''}`}
                />
                {errors.fatherBirthDate && (
                  <p className="form-gov-error-msg">{errors.fatherBirthDate.message}</p>
                )}
              </div>
              <div>
                <label className="form-gov-label">
                  Nationalite du pere
                </label>
                <select
                  value={watch('fatherNationalityId') ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValue('fatherNationalityId', val ? parseInt(val, 10) : undefined);
                  }}
                  className="form-gov-select"
                >
                  <option value="">Francais</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="form-gov-label">
                Ville de naissance <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                {...register('fatherBirthCity')}
                className={`form-gov-input ${errors.fatherBirthCity ? 'form-gov-error' : ''}`}
                placeholder="Ville de naissance du pere"
              />
              {errors.fatherBirthCity && (
                <p className="form-gov-error-msg">{errors.fatherBirthCity.message}</p>
              )}
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
                setValue('motherLastName', '');
                setValue('motherFirstName', '');
                setValue('motherBirthDate', '');
                setValue('motherNationalityId', undefined);
                setValue('motherBirthCity', '');
              }
            }}
          />
          <label htmlFor="motherUnknown">Mere inconnue ou non mentionnee sur l'acte de naissance</label>
        </div>

        {!motherUnknown && (
          <div className="space-y-4 p-4 bg-gray-50">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-gov-label">
                  Nom de jeune fille <span className="text-red-600">*</span>
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
              <div>
                <label className="form-gov-label">
                  Prenom <span className="text-red-600">*</span>
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
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="form-gov-label">
                  Date de naissance
                </label>
                <input
                  type="date"
                  {...register('motherBirthDate')}
                  className={`form-gov-input ${errors.motherBirthDate ? 'form-gov-error' : ''}`}
                />
                {errors.motherBirthDate && (
                  <p className="form-gov-error-msg">{errors.motherBirthDate.message}</p>
                )}
              </div>
              <div>
                <label className="form-gov-label">
                  Nationalite de la mere
                </label>
                <select
                  value={watch('motherNationalityId') ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValue('motherNationalityId', val ? parseInt(val, 10) : undefined);
                  }}
                  className="form-gov-select"
                >
                  <option value="">Francaise</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="form-gov-label">
                Ville de naissance <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                {...register('motherBirthCity')}
                className={`form-gov-input ${errors.motherBirthCity ? 'form-gov-error' : ''}`}
                placeholder="Ville de naissance de la mere"
              />
              {errors.motherBirthCity && (
                <p className="form-gov-error-msg">{errors.motherBirthCity.message}</p>
              )}
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
  );
}

export default StepParents;
