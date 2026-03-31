// Etape Coordonnees - affichee en mode embed (sans authentification)

'use client';

import { useFormContext } from 'react-hook-form';

export function StepContact() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Vos coordonnees
        </h2>
        <p className="form-gov-hint">
          Vos coordonnees sont necessaires pour traiter votre demande et vous envoyer votre carte d'identité.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact.firstName" className="form-gov-label">
            Prénom du demandeur <span className="text-red-600">*</span>
          </label>
          <input
            id="contact.firstName"
            type="text"
            {...register('contact.firstName')}
            className={`form-gov-input ${errors.contact?.firstName ? 'form-gov-error' : ''}`}
            placeholder="Votre prenom"
          />
          {errors.contact?.firstName && (
            <p className="form-gov-error-msg">{errors.contact.firstName.message as string}</p>
          )}
        </div>

        <div>
          <label htmlFor="contact.lastName" className="form-gov-label">
            Nom du demandeur <span className="text-red-600">*</span>
          </label>
          <input
            id="contact.lastName"
            type="text"
            {...register('contact.lastName')}
            className={`form-gov-input ${errors.contact?.lastName ? 'form-gov-error' : ''}`}
            placeholder="Votre nom"
          />
          {errors.contact?.lastName && (
            <p className="form-gov-error-msg">{errors.contact.lastName.message as string}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="contact.email" className="form-gov-label">
          Adresse email <span className="text-red-600">*</span>
        </label>
        <input
          id="contact.email"
          type="email"
          {...register('contact.email')}
          className={`form-gov-input ${errors.contact?.email ? 'form-gov-error' : ''}`}
          placeholder="votre@email.fr"
        />
        {errors.contact?.email && (
          <p className="form-gov-error-msg">{errors.contact.email.message as string}</p>
        )}
      </div>

      <div>
        <label htmlFor="contact.phone" className="form-gov-label">
          Telephone
        </label>
        <input
          id="contact.phone"
          type="tel"
          {...register('contact.phone')}
          className="form-gov-input"
          placeholder="06 12 34 56 78"
        />
      </div>
    </div>
  );
}
