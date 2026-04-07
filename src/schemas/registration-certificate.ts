// Schema Zod pour le certificat d'immatriculation (carte grise)
// Aligne avec l'entite ProcessRegistrationCertificate d'Advercity

import { z } from 'zod';

// Types d'operation (RegistrationCertificateType)
export const operationTypeSchema = z.union([
  z.literal(1), // CHANGEMENT_TITULAIRE
  z.literal(2), // CHANGEMENT_ADRESSE
  z.literal(3), // DUPLICATA
  z.literal(4), // ETAT_MATRIMONIAL
  z.literal(5), // ETAT_CIVIL
  z.literal(6), // CHANGEMENT_PLAQUE
]);

// Etats du vehicule
export const vehicleStateSchema = z.union([
  z.literal(0), // OCCASION
  z.literal(1), // NEUF
  z.literal(2), // IMPORT
]);

// Motifs duplicata
export const duplicateReasonSchema = z.union([
  z.literal(0), // VOL
  z.literal(1), // PERTE
  z.literal(2), // DETERIORATION
]);

// Civilite
export const civilitySchema = z.enum(['M', 'MME'], {
  required_error: 'Veuillez selectionner la civilite',
  invalid_type_error: 'Veuillez selectionner la civilite',
});

// Type d'immatriculation
export const registrationTypeSchema = z.enum(['SIV', 'FNI']);

// Regex pour validation
const PHONE_REGEX = /^0[1-9]\d{8}$/;
const MOBILE_REGEX = /^0[67]\d{8}$/;
const POSTAL_CODE_REGEX = /^\d{5}$/;
const SIREN_REGEX = /^\d{9}$/;
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;
const REGISTRATION_SIV_REGEX = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/;
const REGISTRATION_FNI_REGEX = /^\d{1,4}\s?[A-Z]{2,3}\s?\d{2}$/;

// Schema demandeur (claimer)
export const claimerSchema = z.object({
  civility: civilitySchema,
  lastName: z.string().min(2, 'Nom requis (minimum 2 caracteres)'),
  firstName: z.string().min(2, 'Prenom requis (minimum 2 caracteres)'),
  email: z.string().email('Email invalide'),
  phone: z.string().regex(MOBILE_REGEX, 'Numero de telephone mobile invalide (format: 06XXXXXXXX ou 07XXXXXXXX)'),
  alternativePhone: z.string().regex(PHONE_REGEX, 'Numero de telephone invalide').optional().or(z.literal('')),
  address: z.string().min(5, 'Adresse requise'),
  additionalAddress: z.string().optional(),
  zipCode: z.string().regex(POSTAL_CODE_REGEX, 'Code postal invalide (5 chiffres)'),
  city: z.string().min(2, 'Ville requise'),
  // Si professionnel
  company: z.string().optional(),
  siren: z.string().regex(SIREN_REGEX, 'SIREN invalide (9 chiffres)').optional().or(z.literal('')),
});

// Schema titulaire (holder)
export const holderSchema = z.object({
  sameAsClaimer: z.boolean().default(true),
  civility: civilitySchema.optional(),
  lastName: z.string().optional(),
  firstName: z.string().optional(),
  birthDate: z.string().min(1, 'Date de naissance requise'), // OBLIGATOIRE SIV
  birthCity: z.string().min(2, 'Lieu de naissance requis'),   // OBLIGATOIRE SIV
  birthCountryId: z.number().int().positive().default(1),     // 1 = France
  address: z.string().optional(),
  additionalAddress: z.string().optional(),
  zipCode: z.string().regex(POSTAL_CODE_REGEX, 'Code postal invalide').optional().or(z.literal('')),
  city: z.string().optional(),
  // Si societe
  company: z.string().optional(),
  siren: z.string().regex(SIREN_REGEX, 'SIREN invalide').optional().or(z.literal('')),
}).refine(
  (data) => {
    // Si pas meme que demandeur, les champs sont obligatoires
    if (!data.sameAsClaimer) {
      return !!data.civility && !!data.lastName && !!data.firstName && !!data.address && !!data.zipCode && !!data.city;
    }
    return true;
  },
  { message: 'Informations du titulaire requises si different du demandeur' }
);

// Schema co-titulaire
export const coOwnerSchema = z.object({
  hasCoOwner: z.boolean().default(false),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine(
  (data) => {
    if (data.hasCoOwner) {
      return !!data.firstName && !!data.lastName;
    }
    return true;
  },
  { message: 'Informations du co-titulaire requises' }
);

// Schema vehicule
export const vehicleSchema = z.object({
  // Immatriculation (OBLIGATOIRE)
  registrationNumber: z.string().min(1, 'Immatriculation requise'),
  registrationType: registrationTypeSchema,

  // Identification
  vin: z.string().regex(VIN_REGEX, 'Numero VIN invalide (17 caracteres)').optional().or(z.literal('')),
  certificateNumber: z.string().optional(),

  // Dates
  firstRegistrationDate: z.string().min(1, 'Date de premiere immatriculation requise'),
  currentRegistrationDate: z.string().optional(),

  // Caracteristiques techniques
  vehicleTypeId: z.number().int().positive('Type de vehicule requis'),
  energyId: z.number().int().positive('Energie requise'),
  fiscalPower: z.number().int().min(1, 'Puissance fiscale invalide').max(100),
  co2: z.number().int().min(0).max(500).optional(), // g/km

  // Etat
  state: vehicleStateSchema,
  isCollection: z.boolean().default(false),

  // Controle technique (vehicules > 4 ans)
  technicalControlDate: z.string().optional(),

  // Departement pour calcul taxes (OBLIGATOIRE)
  departmentTaxId: z.number().int().positive('Departement requis'),
}).refine(
  (data) => {
    // Validation format immatriculation selon type
    if (data.registrationType === 'SIV') {
      return REGISTRATION_SIV_REGEX.test(data.registrationNumber);
    } else {
      return REGISTRATION_FNI_REGEX.test(data.registrationNumber);
    }
  },
  { message: 'Format d\'immatriculation invalide', path: ['registrationNumber'] }
);

// Schema operation
export const operationSchema = z.object({
  typeId: operationTypeSchema,
  formerHolder: z.string().optional(), // Ancien titulaire (changement proprietaire)
  duplicateReason: duplicateReasonSchema.optional(),
  maxAddressChangeReached: z.boolean().default(false),
}).refine(
  (data) => {
    // Duplicata doit avoir un motif
    if (data.typeId === 3 && data.duplicateReason === undefined) {
      return false;
    }
    return true;
  },
  { message: 'Motif du duplicata requis', path: ['duplicateReason'] }
);

// Schema consentements
export const consentsSchema = z.object({
  termsAccepted: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter les conditions generales' }) }),
  dataProcessingAccepted: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter le traitement des donnees' }) }),
  newsletterOptIn: z.boolean().default(false),
});

// Schema complet certificat d'immatriculation
export const registrationCertificateSchema = z.object({
  claimer: claimerSchema,
  holder: holderSchema,
  coOwner: coOwnerSchema.optional(),
  vehicle: vehicleSchema,
  operation: operationSchema,
  consents: consentsSchema,
});

export type RegistrationCertificateInput = z.infer<typeof registrationCertificateSchema>;
export type ClaimerInput = z.infer<typeof claimerSchema>;
export type HolderInput = z.infer<typeof holderSchema>;
export type CoOwnerInput = z.infer<typeof coOwnerSchema>;
export type VehicleInput = z.infer<typeof vehicleSchema>;
export type OperationInput = z.infer<typeof operationSchema>;
export type ConsentsInput = z.infer<typeof consentsSchema>;

// Fonction pour mapper vers le payload Advercity
export function mapToAdvercityPayload(input: RegistrationCertificateInput) {
  const holder = input.holder.sameAsClaimer
    ? { ...input.claimer, ...input.holder }
    : input.holder;

  return {
    // Process (parent) - Demandeur
    claimerGender: input.claimer.civility,
    claimerFirstName: input.claimer.firstName,
    claimerLastName: input.claimer.lastName,
    claimerEmail: input.claimer.email,
    claimerPhone: input.claimer.phone,
    claimerAlternativePhone: input.claimer.alternativePhone,
    claimerAddress: input.claimer.address,
    claimerAdditionalAddress: input.claimer.additionalAddress,
    claimerZipcode: input.claimer.zipCode,
    claimerCityName: input.claimer.city,
    claimerCompany: input.claimer.company,
    claimerSiren: input.claimer.siren,

    // ProcessRegistrationCertificate - Titulaire
    holderGender: holder.civility,
    holderFirstName: holder.firstName,
    holderLastName: holder.lastName,
    holderBirthDate: holder.birthDate,
    holderBirthCity: holder.birthCity,
    holderBirthCountryId: holder.birthCountryId,
    holderAddress: holder.address,
    holderAdditionalAddress: holder.additionalAddress,
    holderZipcode: holder.zipCode,
    holderCityName: holder.city,
    holderCompany: holder.company,
    holderSiren: holder.siren,

    // Co-titulaire
    holderCoOwnerFirstName: input.coOwner?.firstName,
    holderCoOwnerLastName: input.coOwner?.lastName,

    // Vehicule
    vehicleRegistrationNumber: input.vehicle.registrationNumber,
    vehicleRegistrationType: input.vehicle.registrationType === 'FNI',
    vehicleIdentificationNumber: input.vehicle.vin,
    certificateNumber: input.vehicle.certificateNumber,
    vehicleRegistrationDateFirst: input.vehicle.firstRegistrationDate,
    vehicleRegistrationDateCurrent: input.vehicle.currentRegistrationDate,
    vehicleTypeId: input.vehicle.vehicleTypeId,
    vehicleEnergyId: input.vehicle.energyId,
    vehiclePower: input.vehicle.fiscalPower,
    vehicleCO2: input.vehicle.co2,
    vehicleState: input.vehicle.state,
    vehicleCollection: input.vehicle.isCollection,
    vehicleTechnicalControl: input.vehicle.technicalControlDate,
    vehicleDepartmentTaxId: input.vehicle.departmentTaxId,

    // Operation
    typeId: input.operation.typeId,
    formerHolder: input.operation.formerHolder,
    duplicateReason: input.operation.duplicateReason,
    maxAddressChange: input.operation.maxAddressChangeReached,
  };
}
