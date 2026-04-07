// Schema Zod pour l'acte de mariage
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

// Etape 1: Informations sur le mariage
export const eventInfoStepSchema = z.object({
  recordType: recordTypeSchema,
  recordCount: z.number().int().min(1, 'Minimum 1 copie').max(3, 'Maximum 3 copies'),
  marriageDate: z.string().min(1, 'Date du mariage requise'),
  marriageCountryId: z.number().int().positive('Pays du mariage requis'),
  marriageCityId: z.number().int().optional(),
  marriageCityName: z.string().min(1, 'Commune du mariage requise'),
});

// Etape 2: Beneficiaire (Epoux 1)
export const beneficiaryStepSchema = z.object({
  gender: genderSchema,
  firstName: z.string().min(2, 'Prenom requis (minimum 2 caracteres)'),
  lastName: z.string().min(2, 'Nom requis (minimum 2 caracteres)'),
  nomUsage: z.string().optional(),
  birthDate: z.string().min(1, 'Date de naissance requise'),
});

// Etape 3: Parents de l'epoux 1 (conditionnel - copie_integrale et extrait_filiation)
export const parentsStepSchema = z.object({
  claimerType: claimerTypeSchema,
  fatherUnknown: z.boolean().default(false),
  fatherFirstName: z.string().optional(),
  fatherLastName: z.string().optional(),
  motherUnknown: z.boolean().default(false),
  motherFirstName: z.string().optional(),
  motherLastName: z.string().optional(),
});

// Etape 4: Conjoint (Epoux 2)
export const spouseStepSchema = z.object({
  spouseGender: genderSchema,
  spouseFirstName: z.string().min(2, 'Prenom du conjoint requis (minimum 2 caracteres)'),
  spouseLastName: z.string().min(2, 'Nom du conjoint requis (minimum 2 caracteres)'),
  spouseNomUsage: z.string().optional(),
  spouseBirthDate: z.string().min(1, 'Date de naissance du conjoint requise'),
});

// Etape 5: Parents du conjoint (conditionnel - copie_integrale et extrait_filiation)
export const spouseParentsStepSchema = z.object({
  spouseFatherUnknown: z.boolean().default(false),
  spouseFatherFirstName: z.string().optional(),
  spouseFatherLastName: z.string().optional(),
  spouseMotherUnknown: z.boolean().default(false),
  spouseMotherFirstName: z.string().optional(),
  spouseMotherLastName: z.string().optional(),
});

// Etape 6: Livraison
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
export const marriageCertificateSchema = z.object({
  // Etape 1: Informations sur le mariage
  recordType: recordTypeSchema,
  recordCount: z.number().int().min(1).max(3),
  marriageDate: z.string().min(1, 'Date du mariage requise'),
  marriageCountryId: z.number().int().positive('Pays du mariage requis'),
  marriageCityId: z.number().int().optional(),
  marriageCityName: z.string().min(1, 'Commune du mariage requise'),
  // Etape 2: Epoux 1
  gender: genderSchema,
  firstName: z.string().min(2, 'Prenom requis (minimum 2 caracteres)'),
  lastName: z.string().min(2, 'Nom requis (minimum 2 caracteres)'),
  nomUsage: z.string().optional(),
  birthDate: z.string().min(1, 'Date de naissance requise'),
  // Etape 3: Parents epoux 1
  claimerType: claimerTypeSchema,
  fatherUnknown: z.boolean().default(false),
  fatherFirstName: z.string().optional(),
  fatherLastName: z.string().optional(),
  motherUnknown: z.boolean().default(false),
  motherFirstName: z.string().optional(),
  motherLastName: z.string().optional(),
  // Etape 4: Epoux 2
  spouseGender: genderSchema,
  spouseFirstName: z.string().min(2, 'Prenom du conjoint requis (minimum 2 caracteres)'),
  spouseLastName: z.string().min(2, 'Nom du conjoint requis (minimum 2 caracteres)'),
  spouseNomUsage: z.string().optional(),
  spouseBirthDate: z.string().min(1, 'Date de naissance du conjoint requise'),
  // Etape 5: Parents epoux 2
  spouseFatherUnknown: z.boolean().default(false),
  spouseFatherFirstName: z.string().optional(),
  spouseFatherLastName: z.string().optional(),
  spouseMotherUnknown: z.boolean().default(false),
  spouseMotherFirstName: z.string().optional(),
  spouseMotherLastName: z.string().optional(),
  // Etape Demandeur (identite + coordonnees + livraison)
  requesterLastName: z.string().min(2, 'Nom du demandeur requis'),
  requesterFirstName: z.string().min(2, 'Prenom du demandeur requis'),
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

export type MarriageCertificateInput = z.infer<typeof marriageCertificateSchema>;

// Mapping vers le payload Advercity
export function mapMarriageCertificateToAdvercity(
  input: MarriageCertificateInput,
  user: { email: string; firstName: string; lastName: string; phone?: string }
) {
  const recordTypeMapping: Record<string, string> = {
    copie_integrale: 'copie_integrale',
    extrait_filiation: 'extrait_filiation',
    extrait_sans_filiation: 'extrait_sans_filiation',
    extrait_plurilingue: 'extrait_plurilingue',
  };

  return {
    civilStatusRecordType: 2, // TYPE_MARRIAGE
    recordType: recordTypeMapping[input.recordType],
    recordCount: input.recordCount,
    claimerType: input.claimerType,
    // Date et lieu du mariage
    marriageDate: input.marriageDate,
    marriageCountry: { id: input.marriageCountryId },
    marriageCity: input.marriageCityId ? { id: input.marriageCityId } : undefined,
    marriageCityName: input.marriageCityName,
    // Epoux 1
    gender: input.gender,
    firstName: input.firstName,
    lastName: input.lastName,
    nomUsage: input.nomUsage || undefined,
    birthDate: input.birthDate,
    // Parents epoux 1
    fatherUnknown: input.fatherUnknown,
    fatherFirstName: input.fatherUnknown ? 'inconnu' : input.fatherFirstName,
    fatherLastName: input.fatherUnknown ? 'inconnu' : input.fatherLastName,
    motherUnknown: input.motherUnknown,
    motherFirstName: input.motherUnknown ? 'inconnu' : input.motherFirstName,
    motherLastName: input.motherUnknown ? 'inconnu' : input.motherLastName,
    // Epoux 2
    spouseGender: input.spouseGender,
    spouseFirstName: input.spouseFirstName,
    spouseLastName: input.spouseLastName,
    spouseNomUsage: input.spouseNomUsage || undefined,
    spouseBirthDate: input.spouseBirthDate,
    // Parents epoux 2
    spouseFatherUnknown: input.spouseFatherUnknown,
    spouseFatherFirstName: input.spouseFatherUnknown ? 'inconnu' : input.spouseFatherFirstName,
    spouseFatherLastName: input.spouseFatherUnknown ? 'inconnu' : input.spouseFatherLastName,
    spouseMotherUnknown: input.spouseMotherUnknown,
    spouseMotherFirstName: input.spouseMotherUnknown ? 'inconnu' : input.spouseMotherFirstName,
    spouseMotherLastName: input.spouseMotherUnknown ? 'inconnu' : input.spouseMotherLastName,
    // Demandeur
    customer: {
      firstName: input.requesterFirstName || user.firstName,
      lastName: input.requesterLastName || user.lastName,
      mail: input.email || user.email,
      phone: input.telephone || user.phone,
    },
    // Livraison
    deliveryAddress: input.deliveryAddress,
  };
}
