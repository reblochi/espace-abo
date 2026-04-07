// Etape livraison partagee — utilisee par tous les formulaires de demarche
// Code postal avec suggestion automatique de ville (PostalCityAutocomplete)

'use client';

import { useFormContext } from 'react-hook-form';
import { PostalCityAutocomplete } from '@/components/forms/PostalCityAutocomplete';

interface SharedStepDeliveryProps {
  /** Texte d'intro (ex: "Adresse a laquelle vous souhaitez recevoir votre acte") */
  description?: string;
}

export function SharedStepDelivery({ description }: SharedStepDeliveryProps) {
  const { register, watch, setValue, formState: { errors } } = useFormContext<{
    deliveryAddress: { street: string; zipCode: string; city: string; country: string };
  }>();

  const deliveryErrors = errors.deliveryAddress as Record<string, { message?: string }> | undefined;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Adresse de livraison
        </h2>
        {description && (
          <p className="form-gov-hint">{description}</p>
        )}
      </div>

      {/* Adresse */}
      <div>
        <label className="form-gov-label">
          Adresse <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          {...register('deliveryAddress.street')}
          className={`form-gov-input ${deliveryErrors?.street ? 'form-gov-error' : ''}`}
          placeholder="Numero et nom de rue"
        />
        {deliveryErrors?.street && (
          <p className="form-gov-error-msg">{deliveryErrors.street.message}</p>
        )}
      </div>

      {/* Code postal + Ville (avec suggestion) */}
      <PostalCityAutocomplete
        cpValue={watch('deliveryAddress.zipCode') || ''}
        cityValue={watch('deliveryAddress.city') || ''}
        onCpChange={(value) => setValue('deliveryAddress.zipCode', value, { shouldValidate: true })}
        onCityChange={(value) => setValue('deliveryAddress.city', value, { shouldValidate: true })}
        cpError={deliveryErrors?.zipCode?.message}
        cityError={deliveryErrors?.city?.message}
        required
      />

      {/* Info livraison */}
      <div className="p-4 bg-blue-50 border-l-4 border-l-blue-500">
        <p className="text-sm text-blue-900">
          Votre document sera envoye par courrier a cette adresse sous 3 a 5 jours ouvres
          apres validation de votre demande.
        </p>
      </div>
    </div>
  );
}

export default SharedStepDelivery;
