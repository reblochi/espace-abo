'use client';

import { useFormContext } from 'react-hook-form';
import { PostalCityAutocomplete } from '@/components/forms/PostalCityAutocomplete';

export function SharedStepRequester({ hideIdentity = false }: { hideIdentity?: boolean } = {}) {
  const { register, watch, setValue, formState: { errors } } = useFormContext<{
    requesterLastName: string;
    requesterFirstName: string;
    email: string;
    emailConfirm: string;
    telephone: string;
    deliveryAddress: { street: string; zipCode: string; city: string; country: string };
  }>();

  const deliveryErrors = errors.deliveryAddress as Record<string, { message?: string }> | undefined;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Vos coordonnees et adresse de livraison</h2>
        <p className="form-gov-hint">Ces informations sont necessaires pour le traitement et l&apos;envoi de votre demarche.</p>
      </div>

      {/* Identite demandeur */}
      {!hideIdentity && (
        <div className="space-y-4">
          <h3 className="form-gov-section-title">Votre identite</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-gov-label">Nom <span className="text-red-600">*</span></label>
              <input type="text" {...register('requesterLastName')} className={`form-gov-input ${errors.requesterLastName ? 'form-gov-error' : ''}`} />
              {errors.requesterLastName && <p className="form-gov-error-msg">{errors.requesterLastName.message as string}</p>}
            </div>
            <div>
              <label className="form-gov-label">Prenom <span className="text-red-600">*</span></label>
              <input type="text" {...register('requesterFirstName')} className={`form-gov-input ${errors.requesterFirstName ? 'form-gov-error' : ''}`} />
              {errors.requesterFirstName && <p className="form-gov-error-msg">{errors.requesterFirstName.message as string}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Coordonnees */}
      <div className="space-y-4">
        <h3 className="form-gov-section-title">Coordonnees</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-gov-label">Email <span className="text-red-600">*</span></label>
            <input type="email" {...register('email')} className={`form-gov-input ${errors.email ? 'form-gov-error' : ''}`} placeholder="votre@email.fr" />
            {errors.email && <p className="form-gov-error-msg">{errors.email.message as string}</p>}
          </div>
          <div>
            <label className="form-gov-label">Confirmation email <span className="text-red-600">*</span></label>
            <input type="email" {...register('emailConfirm')} className={`form-gov-input ${errors.emailConfirm ? 'form-gov-error' : ''}`} placeholder="Confirmez votre email" />
            {errors.emailConfirm && <p className="form-gov-error-msg">{errors.emailConfirm.message as string}</p>}
          </div>
        </div>
        <div>
          <label className="form-gov-label">Telephone <span className="text-red-600">*</span></label>
          <input type="tel" {...register('telephone')} className={`form-gov-input ${errors.telephone ? 'form-gov-error' : ''}`} placeholder="06 12 34 56 78" />
          <p className="form-gov-hint">De preference un numero de portable</p>
          {errors.telephone && <p className="form-gov-error-msg">{errors.telephone.message as string}</p>}
        </div>
      </div>

      {/* Adresse de livraison */}
      <div className="space-y-4">
        <h3 className="form-gov-section-title">Adresse de livraison</h3>
        <div>
          <label className="form-gov-label">Adresse <span className="text-red-600">*</span></label>
          <input type="text" {...register('deliveryAddress.street')} className={`form-gov-input ${deliveryErrors?.street ? 'form-gov-error' : ''}`} placeholder="Numero et nom de rue" />
          {deliveryErrors?.street && <p className="form-gov-error-msg">{deliveryErrors.street.message}</p>}
        </div>
        <PostalCityAutocomplete
          cpValue={watch('deliveryAddress.zipCode') || ''}
          cityValue={watch('deliveryAddress.city') || ''}
          onCpChange={(value) => setValue('deliveryAddress.zipCode', value, { shouldValidate: true })}
          onCityChange={(value) => setValue('deliveryAddress.city', value, { shouldValidate: true })}
          cpError={deliveryErrors?.zipCode?.message}
          cityError={deliveryErrors?.city?.message}
          required
        />
      </div>

      <div className="p-4 bg-blue-50 border-l-4 border-l-blue-500">
        <p className="text-sm text-blue-900">Votre document sera envoye par courrier a cette adresse sous 3 a 5 jours ouvres apres validation.</p>
      </div>
    </div>
  );
}
