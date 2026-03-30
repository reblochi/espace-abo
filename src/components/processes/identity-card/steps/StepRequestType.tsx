// Etape 1: Motif de la demande de carte d'identite

'use client';

import { useFormContext } from 'react-hook-form';
import {
  RequestMotif,
  requestMotifLabels,
  type RequestMotifValue,
} from '@/types/identity-card';
import type { IdentityCardInput } from '@/schemas/identity-card';

const MOTIF_VALUES = Object.values(RequestMotif);

export function StepRequestType() {
  const { watch, setValue, formState: { errors } } = useFormContext<IdentityCardInput>();
  const selectedMotif = watch('motif');

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Pourquoi faites-vous cette demande ?
        </h2>
        <p className="form-gov-hint">
          Selectionnez le motif de votre demande de carte d'identite
        </p>
      </div>

      <div className="space-y-2">
        {MOTIF_VALUES.map((motif) => (
          <label
            key={motif}
            onClick={() => setValue('motif', motif, { shouldValidate: true })}
            className={`
              flex items-center p-4 cursor-pointer transition-colors duration-150 border-l-4
              ${selectedMotif === motif
                ? 'bg-blue-50 border-l-blue-700'
                : 'bg-gray-50 border-l-transparent hover:bg-blue-50/50'
              }
            `}
          >
            <input
              type="radio"
              value={motif}
              checked={selectedMotif === motif}
              onChange={() => setValue('motif', motif, { shouldValidate: true })}
              className="sr-only"
            />
            <div className={`
              w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0
              ${selectedMotif === motif
                ? 'border-blue-700'
                : 'border-gray-500'
              }
            `}>
              {selectedMotif === motif && (
                <div className="w-3 h-3 rounded-full bg-blue-700" />
              )}
            </div>
            <span className={`text-base ${selectedMotif === motif ? 'font-semibold text-gray-900' : 'text-gray-900'}`}>
              {requestMotifLabels[motif]}
            </span>
          </label>
        ))}
      </div>

      {errors.motif && (
        <p className="form-gov-error-msg">{errors.motif.message}</p>
      )}

      {/* Avertissement timbre fiscal pour vol/perte */}
      {(selectedMotif === RequestMotif.RENOUVELLEMENT_VOL || selectedMotif === RequestMotif.RENOUVELLEMENT_PERTE) && (
        <div className="p-4 bg-amber-50 border-l-4 border-l-amber-500">
          <p className="text-base text-amber-900">
            <strong>Attention :</strong> En cas de vol ou de perte, un timbre fiscal de 25 EUR (12,50 EUR en Guyane) est obligatoire
            et sera ajoute au montant de votre demande.
          </p>
        </div>
      )}
    </div>
  );
}

export default StepRequestType;
