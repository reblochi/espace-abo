// Schema Zod pour la carte d'identite (CNI)
// Aligne avec l'ancien formulaire cni-forms (034_forms-next)

import { z } from 'zod';
import { deliveryAddressSchema } from './process';

// Regex pour les noms (lettres, accents, espaces, tirets, apostrophes)
const NOM_REGEX = /^[a-zA-ZÀ-ÿœŒæÆ\s'-]+$/;
const NOM_ERROR = 'Ce champ ne doit pas contenir de caracteres speciaux (chiffres, @, #, etc.)';

// Codes postaux DOM-TOM valides
const DOMTOM_PREFIXES = ['971', '972', '973', '974', '975', '976', '984', '986', '987', '988'];

/** Valide un code postal francais (metropole + DOM-TOM) */
function isValidFrenchPostalCode(cp: string): boolean {
  if (!/^[0-9]{5}$/.test(cp)) return false;
  const prefix2 = cp.substring(0, 2);
  const prefix3 = cp.substring(0, 3);
  if (prefix2 === '97' || prefix2 === '98') {
    return DOMTOM_PREFIXES.includes(prefix3);
  }
  const dept = parseInt(prefix2, 10);
  return dept >= 1 && dept <= 95;
}

const frenchPostalCodeSchema = z.string()
  .min(5, 'Code postal requis (5 chiffres)')
  .max(5, 'Code postal : 5 chiffres')
  .refine(isValidFrenchPostalCode, { message: 'Code postal invalide' });

// --- Schemas par etape ---

// Civilite
export const genderSchema = z.enum(['MALE', 'FEMALE']);

// Etape 1: Motif de la demande
export const requestTypeStepSchema = z.object({
  motif: z.enum(['13', '14', '15', '16', '17', '18', '19', '20', '21'], {
    required_error: 'Veuillez selectionner un motif',
  }),
});

// Etape 2: Identite du titulaire
export const identityStepSchema = z.object({
  gender: genderSchema,
  nom: z.string().min(1, 'Nom requis').max(150).regex(NOM_REGEX, NOM_ERROR),
  nomUsage: z.string().max(150).optional().refine(
    (val) => !val || NOM_REGEX.test(val),
    { message: NOM_ERROR }
  ),
  typeNomUsage: z.enum(['Pere', 'Mere', 'Epoux', 'Epouse']).optional().nullable(),
  motAdditionnelNom: z.enum(['Epoux', 'Veuf']).optional().nullable(),
  prenom: z.string().min(1, 'Prenom requis').max(150).regex(NOM_REGEX, NOM_ERROR),
  birthDate: z.string().min(1, 'Date de naissance requise'),
  birthCountryId: z.number().int().positive('Pays de naissance requis'),
  birthCityId: z.number().int().optional(),
  birthCityName: z.string().min(1, 'Commune de naissance requise'),
  taille: z.number().int().min(20, 'Taille minimum 20 cm').max(280, 'Taille maximum 280 cm'),
  raisonFrancais: z.string().min(1, 'Veuillez indiquer la raison de votre nationalite francaise'),
});

// Etape 3: Parents
export const parentsStepSchema = z.object({
  fatherUnknown: z.boolean().default(false),
  fatherLastName: z.string().max(150).optional().refine(
    (val) => !val || NOM_REGEX.test(val),
    { message: NOM_ERROR }
  ),
  fatherFirstName: z.string().max(150).optional().refine(
    (val) => !val || NOM_REGEX.test(val),
    { message: NOM_ERROR }
  ),
  fatherBirthDate: z.string().optional(),
  fatherNationalityId: z.number().int().optional(), // 0 ou vide = francais
  fatherBirthCity: z.string().max(50).optional(),
  motherUnknown: z.boolean().default(false),
  motherLastName: z.string().max(150).optional().refine(
    (val) => !val || NOM_REGEX.test(val),
    { message: NOM_ERROR }
  ),
  motherFirstName: z.string().max(150).optional().refine(
    (val) => !val || NOM_REGEX.test(val),
    { message: NOM_ERROR }
  ),
  motherBirthDate: z.string().optional(),
  motherNationalityId: z.number().int().optional(), // 0 ou vide = francaise
  motherBirthCity: z.string().max(50).optional(),
});

// Etape 4: Demandeur & Livraison
export const requesterStepSchema = z.object({
  isTitulaire: z.boolean().default(true),
  requesterGender: genderSchema.optional(),
  requesterLastName: z.string().max(150).optional(),
  requesterFirstName: z.string().max(150).optional(),
  requesterBirthDate: z.string().optional(),
  telephone: z.string().min(1, 'Telephone requis').max(20),
  email: z.string().email('Email invalide'),
  emailConfirm: z.string().email('Email invalide'),
  deliveryAddress: z.object({
    street: z.string().min(1, 'Adresse requise'),
    zipCode: frenchPostalCodeSchema,
    city: z.string().min(1, 'Ville requise'),
    country: z.string().default('FR'),
  }),
});

// Contact (mode embed sans authentification)
export const contactSchema = z.object({
  email: z.string().email('Email invalide'),
  firstName: z.string().min(2, 'Prenom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  phone: z.string().optional(),
});

// Consentements
export const consentsStepSchema = z.object({
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter les conditions generales' }) }),
  acceptDataProcessing: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter le traitement des donnees' }) }),
  certifyAccuracy: z.literal(true, { errorMap: () => ({ message: 'Vous devez certifier l\'exactitude des informations' }) }),
});

// Schema complet
export const identityCardSchema = z.object({
  // Etape 1: Motif
  motif: z.enum(['13', '14', '15', '16', '17', '18', '19', '20', '21']),
  // Etape 2: Identite
  gender: genderSchema,
  nom: z.string().min(1, 'Nom requis').max(150).regex(NOM_REGEX, NOM_ERROR),
  nomUsage: z.string().max(150).optional().refine(
    (val) => !val || NOM_REGEX.test(val),
    { message: NOM_ERROR }
  ),
  typeNomUsage: z.enum(['Pere', 'Mere', 'Epoux', 'Epouse']).optional().nullable(),
  motAdditionnelNom: z.enum(['Epoux', 'Veuf']).optional().nullable(),
  prenom: z.string().min(1, 'Prenom requis').max(150).regex(NOM_REGEX, NOM_ERROR),
  birthDate: z.string().min(1, 'Date de naissance requise'),
  birthCountryId: z.number().int().positive('Pays de naissance requis'),
  birthCityId: z.number().int().optional(),
  birthCityName: z.string().min(1, 'Commune de naissance requise'),
  taille: z.number().int().min(20).max(280),
  raisonFrancais: z.string().min(1),
  // Etape 3: Parents
  fatherUnknown: z.boolean().default(false),
  fatherLastName: z.string().max(150).optional(),
  fatherFirstName: z.string().max(150).optional(),
  fatherBirthDate: z.string().optional(),
  fatherNationalityId: z.number().int().optional(),
  fatherBirthCity: z.string().max(50).optional(),
  motherUnknown: z.boolean().default(false),
  motherLastName: z.string().max(150).optional(),
  motherFirstName: z.string().max(150).optional(),
  motherBirthDate: z.string().optional(),
  motherNationalityId: z.number().int().optional(),
  motherBirthCity: z.string().max(50).optional(),
  // Etape 4: Demandeur & Livraison
  isTitulaire: z.boolean().default(true),
  requesterGender: genderSchema.optional(),
  requesterLastName: z.string().max(150).optional(),
  requesterFirstName: z.string().max(150).optional(),
  requesterBirthDate: z.string().optional(),
  telephone: z.string().min(1, 'Telephone requis').max(20),
  email: z.string().email('Email invalide'),
  emailConfirm: z.string().email('Email invalide'),
  deliveryAddress: z.object({
    street: z.string().min(1, 'Adresse requise'),
    zipCode: frenchPostalCodeSchema,
    city: z.string().min(1, 'Ville requise'),
    country: z.string().default('FR'),
  }),
  // Contact (optionnel, mode embed)
  contact: contactSchema.optional(),
  // Consentements
  consents: consentsStepSchema,
})
// Les deux parents ne peuvent pas etre inconnus
.refine((data) => !(data.fatherUnknown && data.motherUnknown), {
  message: 'Les deux parents ne peuvent pas etre inconnus simultanement',
  path: ['fatherUnknown'],
})
// Si pere non inconnu, nom requis
.refine((data) => data.fatherUnknown || (data.fatherLastName && data.fatherLastName.trim().length > 0), {
  message: 'Nom du pere requis',
  path: ['fatherLastName'],
})
.refine((data) => data.fatherUnknown || (data.fatherFirstName && data.fatherFirstName.trim().length > 0), {
  message: 'Prenom du pere requis',
  path: ['fatherFirstName'],
})
// Si pere non inconnu, ville de naissance requise
.refine((data) => data.fatherUnknown || (data.fatherBirthCity && data.fatherBirthCity.trim().length > 0), {
  message: 'Ville de naissance du pere requise',
  path: ['fatherBirthCity'],
})
// Si mere non inconnue, nom requis
.refine((data) => data.motherUnknown || (data.motherLastName && data.motherLastName.trim().length > 0), {
  message: 'Nom de la mere requis',
  path: ['motherLastName'],
})
.refine((data) => data.motherUnknown || (data.motherFirstName && data.motherFirstName.trim().length > 0), {
  message: 'Prenom de la mere requis',
  path: ['motherFirstName'],
})
// Si mere non inconnue, ville de naissance requise
.refine((data) => data.motherUnknown || (data.motherBirthCity && data.motherBirthCity.trim().length > 0), {
  message: 'Ville de naissance de la mere requise',
  path: ['motherBirthCity'],
})
// Si nom d'usage rempli, type obligatoire
.refine((data) => {
  if (data.nomUsage && data.nomUsage.trim().length > 0) {
    return !!data.typeNomUsage;
  }
  return true;
}, {
  message: 'Veuillez preciser le type de nom d\'usage',
  path: ['typeNomUsage'],
})
// Confirmation email doit correspondre
.refine((data) => data.email === data.emailConfirm, {
  message: 'Les 2 adresses email ne sont pas identiques',
  path: ['emailConfirm'],
})
// Date naissance pere < date naissance titulaire
.refine((data) => {
  if (data.fatherUnknown || !data.fatherBirthDate || !data.birthDate) return true;
  return new Date(data.fatherBirthDate) < new Date(data.birthDate);
}, {
  message: 'La date de naissance du pere doit etre anterieure a celle du titulaire',
  path: ['fatherBirthDate'],
})
// Date naissance mere < date naissance titulaire
.refine((data) => {
  if (data.motherUnknown || !data.motherBirthDate || !data.birthDate) return true;
  return new Date(data.motherBirthDate) < new Date(data.birthDate);
}, {
  message: 'La date de naissance de la mere doit etre anterieure a celle du titulaire',
  path: ['motherBirthDate'],
})
// Telephone francais : 10 chiffres commencant par 0
.refine((data) => {
  const tel = data.telephone.replace(/[\s\-.]/g, '');
  return /^0[0-9]{9}$/.test(tel);
}, {
  message: 'Format invalide (exemple : 06 12 34 56 78)',
  path: ['telephone'],
});

export type IdentityCardInput = z.infer<typeof identityCardSchema>;

// Champs a valider par etape (utilise pour la navigation step-by-step)
export const STEP_FIELDS: Record<string, (keyof IdentityCardInput)[]> = {
  requestType: ['motif'],
  identity: ['gender', 'nom', 'prenom', 'birthDate', 'birthCountryId', 'birthCityName', 'taille', 'raisonFrancais'],
  parents: ['fatherUnknown', 'motherUnknown'],
  requester: ['telephone', 'email', 'emailConfirm', 'deliveryAddress'],
  contact: ['contact'],
  summary: ['consents'],
};

// Mapping vers le payload Advercity
export function mapIdentityCardToAdvercity(
  input: IdentityCardInput,
  user: { email: string; firstName: string; lastName: string; phone?: string }
) {
  return {
    motif: input.motif,
    // Titulaire
    gender: input.gender === 'MALE' ? 'm' : 'f',
    nom: input.nom,
    nomUsage: input.nomUsage || null,
    typeNomUsage: input.typeNomUsage || null,
    motAdditionnelNom: input.motAdditionnelNom || null,
    prenom: input.prenom,
    birthDate: input.birthDate,
    birthCountry: { id: input.birthCountryId },
    birthCity: input.birthCityId ? { id: input.birthCityId } : undefined,
    birthCityName: input.birthCityName,
    taille: input.taille,
    raisonFrancais: input.raisonFrancais,
    // Parents
    fatherUnknown: input.fatherUnknown,
    fatherLastName: input.fatherUnknown ? 'inconnu' : input.fatherLastName,
    fatherFirstName: input.fatherUnknown ? 'inconnu' : input.fatherFirstName,
    fatherBirthDate: input.fatherBirthDate || null,
    fatherNationalityId: input.fatherNationalityId || null,
    fatherBirthCity: input.fatherBirthCity || null,
    motherUnknown: input.motherUnknown,
    motherLastName: input.motherUnknown ? 'inconnu' : input.motherLastName,
    motherFirstName: input.motherUnknown ? 'inconnu' : input.motherFirstName,
    motherBirthDate: input.motherBirthDate || null,
    motherNationalityId: input.motherNationalityId || null,
    motherBirthCity: input.motherBirthCity || null,
    // Demandeur (si different du titulaire)
    isTitulaire: input.isTitulaire,
    requesterGender: input.isTitulaire ? (input.gender === 'MALE' ? 'm' : 'f') : (input.requesterGender === 'MALE' ? 'm' : 'f'),
    requesterLastName: input.isTitulaire ? input.nom : (input.requesterLastName || null),
    requesterFirstName: input.isTitulaire ? input.prenom : (input.requesterFirstName || null),
    requesterBirthDate: input.isTitulaire ? input.birthDate : (input.requesterBirthDate || null),
    requesterEmail: input.email,
    requesterPhone: input.telephone,
    // Customer (pour creation/lookup dans Advercity)
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
