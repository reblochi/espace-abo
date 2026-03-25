// Etape 1: Motif de la demande de carte d'identite

'use client';

import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import {
  RequestMotif,
  requestMotifLabels,
  requestMotifDescriptions,
  type RequestMotifValue,
} from '@/types/identity-card';
import type { IdentityCardInput } from '@/schemas/identity-card';

const MOTIF_ICONS: Record<RequestMotifValue, JSX.Element> = {
  [RequestMotif.PREMIERE_DEMANDE]: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  [RequestMotif.RENOUVELLEMENT_VOL]: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  [RequestMotif.RENOUVELLEMENT_PERTE]: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  [RequestMotif.RENOUVELLEMENT_EXPIRATION]: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  [RequestMotif.MODIFICATION_ETAT_CIVIL]: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  [RequestMotif.CHANGEMENT_ADRESSE]: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  [RequestMotif.RECTIFICATION]: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  [RequestMotif.DETERIORATION]: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
  [RequestMotif.IDENTITE_NUMERIQUE]: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
};

const MOTIF_VALUES = Object.values(RequestMotif);

export function StepRequestType() {
  const { watch, setValue, formState: { errors } } = useFormContext<IdentityCardInput>();
  const selectedMotif = watch('motif');

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium text-gray-700 mb-4">
        Quel est le motif de votre demande ?
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {MOTIF_VALUES.map((motif) => (
          <button
            key={motif}
            type="button"
            onClick={() => setValue('motif', motif, { shouldValidate: true })}
            className={cn(
              'flex items-start p-4 rounded-lg border-2 text-left transition-all',
              selectedMotif === motif
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            <div className={cn(
              'p-2 rounded-lg mr-3 flex-shrink-0',
              selectedMotif === motif ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
            )}>
              {MOTIF_ICONS[motif]}
            </div>
            <div>
              <h4 className={cn(
                'font-medium text-sm',
                selectedMotif === motif ? 'text-blue-900' : 'text-gray-900'
              )}>
                {requestMotifLabels[motif]}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {requestMotifDescriptions[motif]}
              </p>
            </div>
          </button>
        ))}
      </div>

      {errors.motif && (
        <p className="mt-2 text-sm text-red-600">{errors.motif.message}</p>
      )}

      {/* Avertissement timbre fiscal pour vol/perte */}
      {(selectedMotif === RequestMotif.RENOUVELLEMENT_VOL || selectedMotif === RequestMotif.RENOUVELLEMENT_PERTE) && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-amber-800">
              En cas de vol ou de perte, un timbre fiscal de 25 EUR (12,50 EUR en Guyane) est obligatoire
              et sera ajoute au montant de votre demande.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default StepRequestType;
