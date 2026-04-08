// Modal proposant de mettre a jour le profil quand des infos pre-remplies ont ete modifiees

'use client';

import * as React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks';
import type { Profile } from '@/types';

/** Mapping: cle = champ profil, formKey = chemin dans les donnees du formulaire */
export interface FieldMapping {
  profileKey: keyof Profile;
  formKey: string;
  label: string;
  /** Transforme la valeur profil pour la comparer (ex: birthDate → string) */
  transform?: (val: unknown) => string;
}

/** Mappings standards reutilises par tous les formulaires d'etat civil */
export const REQUESTER_FIELDS: FieldMapping[] = [
  { profileKey: 'phone', formKey: 'telephone', label: 'Telephone' },
  { profileKey: 'address', formKey: 'deliveryAddress.street', label: 'Adresse' },
  { profileKey: 'zipCode', formKey: 'deliveryAddress.zipCode', label: 'Code postal' },
  { profileKey: 'city', formKey: 'deliveryAddress.city', label: 'Ville' },
];

export const BENEFICIARY_FIELDS: FieldMapping[] = [
  { profileKey: 'gender', formKey: 'gender', label: 'Civilite' },
  { profileKey: 'firstName', formKey: 'firstName', label: 'Prenom' },
  { profileKey: 'lastName', formKey: 'lastName', label: 'Nom' },
  {
    profileKey: 'birthDate',
    formKey: 'birthDate',
    label: 'Date de naissance',
    transform: (val) => (val ? new Date(val as string).toISOString().split('T')[0] : ''),
  },
  { profileKey: 'birthCityName', formKey: 'birthCityName', label: 'Ville de naissance' },
];

/** Variante carte d'identite (nom/prenom inverses) */
export const IDENTITY_BENEFICIARY_FIELDS: FieldMapping[] = [
  { profileKey: 'gender', formKey: 'gender', label: 'Civilite' },
  { profileKey: 'firstName', formKey: 'prenom', label: 'Prenom' },
  { profileKey: 'lastName', formKey: 'nom', label: 'Nom' },
  {
    profileKey: 'birthDate',
    formKey: 'birthDate',
    label: 'Date de naissance',
    transform: (val) => (val ? new Date(val as string).toISOString().split('T')[0] : ''),
  },
  { profileKey: 'birthCityName', formKey: 'birthCityName', label: 'Ville de naissance' },
];

interface Change {
  label: string;
  profileKey: keyof Profile;
  oldValue: string;
  newValue: string;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined), obj as unknown);
}

function normalise(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function formatDisplayValue(key: keyof Profile, value: string): string {
  if (key === 'gender') {
    if (value === 'MALE') return 'Homme';
    if (value === 'FEMALE') return 'Femme';
  }
  return value;
}

/** Detecte les champs du formulaire qui different du profil */
export function detectProfileChanges(
  profile: Profile | undefined,
  formData: Record<string, unknown>,
  fieldMappings: FieldMapping[],
): Change[] {
  if (!profile) return [];
  const changes: Change[] = [];

  for (const mapping of fieldMappings) {
    const profileRaw = profile[mapping.profileKey];
    const profileVal = mapping.transform ? mapping.transform(profileRaw) : normalise(profileRaw);
    const formVal = normalise(getNestedValue(formData, mapping.formKey));

    // Ignorer si le champ formulaire est vide (pas de donnee a proposer)
    if (!formVal) continue;
    // Ignorer si le profil n'a pas de valeur (le champ est nouveau, pas une modification)
    // Sauf si le profil est vide et le formulaire rempli → proposer d'ajouter
    if (normalise(profileVal) !== formVal) {
      changes.push({
        label: mapping.label,
        profileKey: mapping.profileKey,
        oldValue: normalise(profileVal),
        newValue: formVal,
      });
    }
  }

  return changes;
}

export interface ProfileUpdatePromptProps {
  isOpen: boolean;
  changes: Change[];
  onConfirm: () => void;
  onSkip: () => void;
  isUpdating?: boolean;
}

export function ProfileUpdatePrompt({
  isOpen,
  changes,
  onConfirm,
  onSkip,
  isUpdating = false,
}: ProfileUpdatePromptProps) {
  if (changes.length === 0) return null;

  return (
    <Modal isOpen={isOpen} onClose={onSkip} title="Mettre a jour votre profil ?" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Vous avez modifie certaines informations par rapport a votre profil.
          Souhaitez-vous les enregistrer pour vos prochaines demarches ?
        </p>

        <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
          {changes.map((change) => (
            <div key={change.profileKey} className="px-4 py-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {change.label}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm">
                {change.oldValue ? (
                  <>
                    <span className="text-gray-400 line-through">
                      {formatDisplayValue(change.profileKey, change.oldValue)}
                    </span>
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                ) : null}
                <span className="font-medium text-gray-900">
                  {formatDisplayValue(change.profileKey, change.newValue)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onSkip} disabled={isUpdating}>
            Non merci
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isUpdating}>
            {isUpdating ? 'Mise a jour...' : 'Mettre a jour mon profil'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
