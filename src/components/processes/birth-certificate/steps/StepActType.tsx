// Etape 1: Type d'acte et nombre de copies

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { RecordType, recordTypeLabels, recordTypeDescriptions } from '@/types/birth-certificate';
import type { BirthCertificateInput } from '@/schemas/birth-certificate';

const RECORD_TYPES = [
  {
    value: RecordType.COPIE_INTEGRALE,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    value: RecordType.EXTRAIT_FILIATION,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    value: RecordType.EXTRAIT_SANS_FILIATION,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    value: RecordType.EXTRAIT_PLURILINGUE,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const COPY_COUNTS = [1, 2, 3];

export function StepActType() {
  const { watch, setValue, formState: { errors } } = useFormContext<BirthCertificateInput>();
  const selectedType = watch('recordType');
  const selectedCount = watch('recordCount');

  return (
    <div className="space-y-8">
      {/* Type d'extrait */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-4">Type d'extrait</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RECORD_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setValue('recordType', type.value, { shouldValidate: true })}
              className={cn(
                'flex items-start p-4 rounded-lg border-2 text-left transition-all',
                selectedType === type.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className={cn(
                'p-2 rounded-lg mr-4 flex-shrink-0',
                selectedType === type.value ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
              )}>
                {type.icon}
              </div>
              <div>
                <h4 className={cn(
                  'font-medium',
                  selectedType === type.value ? 'text-blue-900' : 'text-gray-900'
                )}>
                  {recordTypeLabels[type.value]}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {recordTypeDescriptions[type.value]}
                </p>
              </div>
            </button>
          ))}
        </div>
        {errors.recordType && (
          <p className="mt-2 text-sm text-red-600">{errors.recordType.message}</p>
        )}
      </div>

      {/* Nombre de copies */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-4">Nombre de copies</h3>
        <div className="flex gap-3">
          {COPY_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setValue('recordCount', count, { shouldValidate: true })}
              className={cn(
                'w-16 h-16 rounded-lg border-2 flex items-center justify-center text-lg font-medium transition-all',
                selectedCount === count
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              )}
            >
              {count}
            </button>
          ))}
        </div>
        {errors.recordCount && (
          <p className="mt-2 text-sm text-red-600">{errors.recordCount.message}</p>
        )}
      </div>
    </div>
  );
}

export default StepActType;
