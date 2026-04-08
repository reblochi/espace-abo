'use client';

import { useFormContext } from 'react-hook-form';

interface StepResetButtonProps {
  fields: string[];
}

function getNestedValue(obj: Record<string, unknown> | undefined, path: string): unknown {
  if (!obj) return undefined;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a === 'object') {
    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;
    const keys = new Set([...Object.keys(objA), ...Object.keys(objB)]);
    return [...keys].every(key => isDeepEqual(objA[key], objB[key]));
  }
  return false;
}

export function StepResetButton({ fields }: StepResetButtonProps) {
  const { watch, resetField, formState: { defaultValues } } = useFormContext();

  const values = watch(fields);
  const hasModifiedFields = fields.some((field, i) => {
    const current = values[i];
    const defaultVal = getNestedValue(defaultValues as Record<string, unknown>, field);
    return !isDeepEqual(current, defaultVal);
  });

  if (!hasModifiedFields) return null;

  const handleReset = () => {
    fields.forEach(field => resetField(field));
  };

  return (
    <button
      type="button"
      onClick={handleReset}
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors mb-4"
      title="Effacer les donnees pre-remplies"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
      Effacer les donnees pre-remplies
    </button>
  );
}
