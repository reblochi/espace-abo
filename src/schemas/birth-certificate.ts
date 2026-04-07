// Schema Zod pour l'acte de naissance
// Aligne avec l'entite ProcessCivilStatusRecord d'Advercity

import { z } from 'zod';
import { deliveryAddressSchema } from './process';

// Types d'extrait
export const recordTypeSchema = z.enum([
  'copie_integrale',
  'extrait_filiation',
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
});

// Etape 2: Beneficiaire
export const beneficiaryStepSchema = z.object({
  gender: genderSchema,
  firstName: z.string().min(2, 'Prenom requis (minimum 2 caracteres)'),
  lastName: z.string().min(2, 'Nom requis (minimum 2 caracteres)'),
  birthDate: z.string().min(1, 'Date de naissance requise'),
  birthCountryId: z.number().int().positive('Pays de naissance requis'),
  birthCityId: z.number().int().optional(),
  birthCityName: z.string().min(1, 'Commune de naissance requise'),
});

// Etape 3: Filiation (conditionnel)
export const filiationStepSchema = z.object({
  claimerType: claimerTypeSchema,
  fatherUnknown: z.boolean().default(false),
  fatherFirstName: z.string().optional(),
  fatherLastName: z.string().optional(),
  motherUnknown: z.boolean().default(false),
  motherFirstName: z.string().optional(),
  motherLastName: z.string().optional(),
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
  retractationExecution: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter l\'execution immediate du service' }) }),
  retractationRenonciation: z.literal(true, { errorMap: () => ({ message: 'Vous devez renoncer a votre droit de retractation' }) }),
});

// Contact (mode embed sans authentification)
export const contactSchema = z.object({
  email: z.string().email('Email invalide'),
  firstName: z.string().min(2, 'Prenom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  phone: z.string().optional(),
});

// Schema complet
export const birthCertificateSchema = z.object({
  // Etape 1
  recordType: recordTypeSchema,
  recordCount: z.number().int().min(1).max(3),
  // Etape 2
  gender: genderSchema,
  firstName: z.string().min(2, 'Prenom requis (minimum 2 caracteres)'),
  lastName: z.string().min(2, 'Nom requis (minimum 2 caracteres)'),
  birthDate: z.string().min(1, 'Date de naissance requise'),
  birthCountryId: z.number().int().positive('Pays de naissance requis'),
  birthCityId: z.number().int().optional(),
  birthCityName: z.string().min(1, 'Commune de naissance requise'),
  // Etape 3
  claimerType: claimerTypeSchema,
  fatherUnknown: z.boolean().default(false),
  fatherFirstName: z.string().optional(),
  fatherLastName: z.string().optional(),
  motherUnknown: z.boolean().default(false),
  motherFirstName: z.string().optional(),
  motherLastName: z.string().optional(),
  // Etape Demandeur (livraison + coordonnees)
  deliveryAddress: deliveryAddressSchema,
  email: z.string().email('Email invalide'),
  emailConfirm: z.string().email('Email invalide'),
  telephone: z.string().min(1, 'Telephone requis').max(20),
  // Consentements
  consents: consentsStepSchema,
})
  .refine((data) => data.email === data.emailConfirm, {
    message: 'Les 2 adresses email ne sont pas identiques',
    path: ['emailConfirm'],
  })
  .refine((data) => {
    const tel = data.telephone.replace(/[\s\-.]/g, '');
    return /^0[0-9]{9}$/.test(tel);
  }, {
    message: 'Format invalide (exemple : 06 12 34 56 78)',
    path: ['telephone'],
  });

export type BirthCertificateInput = z.infer<typeof birthCertificateSchema>;

// Champs a valider par etape
export const STEP_FIELDS: (keyof BirthCertificateInput)[][] = [
  // Etape 0: Type d'acte
  ['recordType', 'recordCount'],
  // Etape 1: Beneficiaire
  ['gender', 'firstName', 'lastName', 'birthDate', 'birthCountryId', 'birthCityName'],
  // Etape 2: Filiation
  ['claimerType'],
  // Etape 3: Livraison
  ['deliveryAddress'],
  // Etape 4: Recapitulatif (consentements)
  ['consents'],
];

// Mapping vers le payload Advercity
export function mapBirthCertificateToAdvercity(
  input: BirthCertificateInput,
  user: { email: string; firstName: string; lastName: string; phone?: string }
) {
  // Mapper recordType vers le format Advercity
  const recordTypeMapping: Record<string, string> = {
    copie_integrale: 'copie_integrale',
    extrait_filiation: 'extrait_filiation',
    extrait_sans_filiation: 'extrait_sans_filiation',
    extrait_plurilingue: 'extrait_plurilingue',
  };

  return {
    civilStatusRecordType: 1, // TYPE_BIRTH
    recordType: recordTypeMapping[input.recordType],
    recordCount: input.recordCount,
    claimerType: input.claimerType,
    gender: input.gender,
    firstName: input.firstName,
    lastName: input.lastName,
    birthDate: input.birthDate,
    birthCountry: { id: input.birthCountryId },
    birthCity: input.birthCityId ? { id: input.birthCityId } : undefined,
    birthCityName: input.birthCityName,
    // Parents
    fatherUnknown: input.fatherUnknown,
    fatherFirstName: input.fatherUnknown ? 'inconnu' : input.fatherFirstName,
    fatherLastName: input.fatherUnknown ? 'inconnu' : input.fatherLastName,
    motherUnknown: input.motherUnknown,
    motherFirstName: input.motherUnknown ? 'inconnu' : input.motherFirstName,
    motherLastName: input.motherUnknown ? 'inconnu' : input.motherLastName,
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
