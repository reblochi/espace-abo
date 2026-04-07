// Schema Zod pour l'acte de deces
// Aligne avec l'entite ProcessCivilStatusRecord d'Advercity

import { z } from 'zod';
import { deliveryAddressSchema } from './process';

// Types d'extrait (sans extrait_filiation pour les deces)
export const recordTypeSchema = z.enum([
  'copie_integrale',
  'extrait_sans_filiation',
  'extrait_plurilingue',
]);

// Types de demandeur
export const claimerTypeSchema = z.enum([
  'titulaire',
  'pere_ou_mere',
  'conjoint',
  'fils_ou_fille',
  'representant_legal',
  'autre',
]);

// Civilite
export const genderSchema = z.enum(['MALE', 'FEMALE'], {
  required_error: 'Veuillez selectionner la civilite',
  invalid_type_error: 'Veuillez selectionner la civilite',
});

// --- Schemas par etape ---

// Etape 1: Type d'acte
export const actTypeStepSchema = z.object({
  recordType: recordTypeSchema,
  recordCount: z.number().int().min(1, 'Minimum 1 copie').max(3, 'Maximum 3 copies'),
  deathDate: z.string().min(1, 'Date de deces requise'),
  deathCountryId: z.number().int().positive('Pays de deces requis'),
  deathCityId: z.number().int().optional(),
  deathCityName: z.string().min(1, 'Commune de deces requise'),
});

// Etape 2: Beneficiaire (personne decedee)
export const beneficiaryStepSchema = z.object({
  gender: genderSchema,
  firstName: z.string().min(2, 'Prenom requis (minimum 2 caracteres)'),
  lastName: z.string().min(2, 'Nom requis (minimum 2 caracteres)'),
  birthDate: z.string().min(1, 'Date de naissance requise'),
});

// Etape 3: Filiation (demandeur uniquement, sans parents)
export const filiationStepSchema = z.object({
  claimerType: claimerTypeSchema,
});

// Etape 4: Livraison
export const deliveryStepSchema = z.object({
  deliveryAddress: deliveryAddressSchema,
});

// Consentements
export const consentsStepSchema = z.object({
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter les conditions generales' }) }),
  acceptDataProcessing: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter le traitement des donnees' }) }),
  certifyAccuracy: z.literal(true, { errorMap: () => ({ message: 'Vous devez certifier l\'exactitude des informations' }) }),
});

// Contact (mode embed sans authentification)
export const contactSchema = z.object({
  email: z.string().email('Email invalide'),
  firstName: z.string().min(2, 'Prenom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  phone: z.string().optional(),
});

// Schema complet
export const deathCertificateSchema = z.object({
  // Etape 1
  recordType: recordTypeSchema,
  recordCount: z.number().int().min(1).max(3),
  deathDate: z.string().min(1, 'Date de deces requise'),
  deathCountryId: z.number().int().positive('Pays de deces requis'),
  deathCityId: z.number().int().optional(),
  deathCityName: z.string().min(1, 'Commune de deces requise'),
  // Etape 2
  gender: genderSchema,
  firstName: z.string().min(2, 'Prenom requis (minimum 2 caracteres)'),
  lastName: z.string().min(2, 'Nom requis (minimum 2 caracteres)'),
  birthDate: z.string().min(1, 'Date de naissance requise'),
  // Etape 3
  claimerType: claimerTypeSchema,
  // Etape 4
  deliveryAddress: deliveryAddressSchema,
  // Contact (optionnel, mode embed)
  contact: contactSchema.optional(),
  // Consentements
  consents: consentsStepSchema,
});

export type DeathCertificateInput = z.infer<typeof deathCertificateSchema>;

// Champs a valider par etape
export const STEP_FIELDS: (keyof DeathCertificateInput)[][] = [
  // Etape 0: Type d'acte
  ['recordType', 'recordCount', 'deathDate', 'deathCountryId', 'deathCityName'],
  // Etape 1: Beneficiaire
  ['gender', 'firstName', 'lastName', 'birthDate'],
  // Etape 2: Demandeur
  ['claimerType'],
  // Etape 3: Livraison
  ['deliveryAddress'],
  // Etape 4: Recapitulatif (consentements)
  ['consents'],
];

// Mapping vers le payload Advercity
export function mapDeathCertificateToAdvercity(
  input: DeathCertificateInput,
  user: { email: string; firstName: string; lastName: string; phone?: string }
) {
  return {
    civilStatusRecordType: 3, // TYPE_DEATH
    recordType: input.recordType,
    recordCount: input.recordCount,
    claimerType: input.claimerType,
    gender: input.gender,
    firstName: input.firstName,
    lastName: input.lastName,
    birthDate: input.birthDate,
    // Deces
    deathDate: input.deathDate,
    deathCountry: { id: input.deathCountryId },
    deathCity: input.deathCityId ? { id: input.deathCityId } : undefined,
    deathCityName: input.deathCityName,
    // Demandeur
    customer: {
      firstName: user.firstName,
      lastName: user.lastName,
      mail: user.email,
      phone: user.phone,
    },
    // Livraison
    deliveryAddress: input.deliveryAddress,
  };
}
