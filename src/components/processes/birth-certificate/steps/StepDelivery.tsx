// Etape 4: Adresse de livraison

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import type { BirthCertificateInput } from '@/schemas/birth-certificate';

export function StepDelivery() {
  const { register, formState: { errors } } = useFormContext<BirthCertificateInput>();

  const deliveryErrors = errors.deliveryAddress;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-2">
        Adresse a laquelle vous souhaitez recevoir votre acte de naissance.
      </p>

      {/* Adresse */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adresse <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('deliveryAddress.street')}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
            'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            deliveryErrors?.street && 'border-red-500 focus:ring-red-500'
          )}
          placeholder="Numéro et nom de rue"
        />
        {deliveryErrors?.street && (
          <p className="mt-1 text-sm text-red-600">{deliveryErrors.street.message}</p>
        )}
      </div>

      {/* Code postal + Ville */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Code postal <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('deliveryAddress.zipCode')}
            className={cn(
              'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
              'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              deliveryErrors?.zipCode && 'border-red-500 focus:ring-red-500'
            )}
            placeholder="75001"
            maxLength={5}
          />
          {deliveryErrors?.zipCode && (
            <p className="mt-1 text-sm text-red-600">{deliveryErrors.zipCode.message}</p>
          )}
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ville <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('deliveryAddress.city')}
            className={cn(
              'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm',
              'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              deliveryErrors?.city && 'border-red-500 focus:ring-red-500'
            )}
            placeholder="Paris"
          />
          {deliveryErrors?.city && (
            <p className="mt-1 text-sm text-red-600">{deliveryErrors.city.message}</p>
          )}
        </div>
      </div>

      {/* Info livraison */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-700">
            L'acte sera envoyé par courrier à cette adresse sous 3 à 5 jours ouvrés
            apres validation de votre demande.
          </p>
        </div>
      </div>
    </div>
  );
}

export default StepDelivery;
