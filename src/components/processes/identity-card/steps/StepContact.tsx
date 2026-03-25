// Etape Coordonnees - affichee en mode embed (sans authentification)

'use client';

import { useFormContext } from 'react-hook-form';

export function StepContact() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        Vos coordonnees sont necessaires pour traiter votre demande et vous envoyer votre carte d'identite.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact.firstName" className="block text-sm font-medium text-gray-700 mb-1">
            Prenom du demandeur *
          </label>
          <input
            id="contact.firstName"
            type="text"
            {...register('contact.firstName')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Votre prenom"
          />
          {errors.contact?.firstName && (
            <p className="text-sm text-red-600 mt-1">{errors.contact.firstName.message as string}</p>
          )}
        </div>

        <div>
          <label htmlFor="contact.lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Nom du demandeur *
          </label>
          <input
            id="contact.lastName"
            type="text"
            {...register('contact.lastName')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Votre nom"
          />
          {errors.contact?.lastName && (
            <p className="text-sm text-red-600 mt-1">{errors.contact.lastName.message as string}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="contact.email" className="block text-sm font-medium text-gray-700 mb-1">
          Adresse email *
        </label>
        <input
          id="contact.email"
          type="email"
          {...register('contact.email')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="votre@email.fr"
        />
        {errors.contact?.email && (
          <p className="text-sm text-red-600 mt-1">{errors.contact.email.message as string}</p>
        )}
      </div>

      <div>
        <label htmlFor="contact.phone" className="block text-sm font-medium text-gray-700 mb-1">
          Telephone
        </label>
        <input
          id="contact.phone"
          type="tel"
          {...register('contact.phone')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="06 12 34 56 78"
        />
      </div>
    </div>
  );
}
