// Schema Zod pour le certificat d'immatriculation (carte grise)
// Aligne avec le pattern BirthCertificateForm / IdentityCardForm

import { z } from 'zod';

// ============================================================
// CONSTANTES
// ============================================================

const PHONE_REGEX = /^0[0-9]{9}$/;
const POSTAL_CODE_REGEX = /^\d{5}$/;

// ============================================================
// SOUS-SCHEMAS
// ============================================================

export const operationSchema = z.object({
  typeId: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  duplicateReason: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  maxAddressChange: z.boolean().default(false),
});

export const holderSchema = z.object({
  civility: z.enum(['M', 'MME'], { required_error: 'Civilite requise' }),
  lastName: z.string().min(2, 'Nom requis (minimum 2 caracteres)'),
  firstName: z.string().min(2, 'Prenom requis (minimum 2 caracteres)'),
  birthDate: z.string().min(1, 'Date de naissance requise'),
  birthCityName: z.string().min(2, 'Lieu de naissance requis'),
  address: z.string().min(5, 'Adresse requise'),
  additionalAddress: z.string().optional(),
  zipCode: z.string().regex(POSTAL_CODE_REGEX, 'Code postal invalide (5 chiffres)'),
  city: z.string().min(2, 'Ville requise'),
  departmentCode: z.string().min(2, 'Departement requis'),
  isCompany: z.boolean().default(false),
  companyName: z.string().optional(),
  siren: z.string().optional(),
});

export const coOwnerSchema = z.object({
  hasCoOwner: z.boolean().default(false),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const vehicleSchema = z.object({
  registrationNumber: z.string().min(1, 'Immatriculation requise'),
  vehicleTypeId: z.coerce.number({ invalid_type_error: 'Type de vehicule requis' }).int().positive('Type de vehicule requis'),
  energyId: z.coerce.number({ invalid_type_error: 'Energie requise' }).int().positive('Energie requise'),
  fiscalPower: z.coerce.number({ invalid_type_error: 'Puissance fiscale requise' }).int().min(1, 'Puissance fiscale invalide (minimum 1 CV)').max(100, 'Puissance fiscale invalide (maximum 100 CV)'),
  co2: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || Number.isNaN(Number(val)) ? undefined : Number(val)),
    z.number().int().min(0, 'Valeur CO2 invalide').max(500, 'Valeur CO2 invalide (maximum 500 g/km)').optional(),
  ),
  state: z.union([z.literal(0), z.literal(1)]),
  registrationDate: z.string().min(1, 'Date de 1ere immatriculation requise'),
  make: z.string().optional(),
  model: z.string().optional(),
  technicalControlDate: z.string().optional(),
});

export const deliveryAddressSchema = z.object({
  street: z.string().min(5, 'Adresse requise'),
  zipCode: z.string().regex(POSTAL_CODE_REGEX, 'Code postal invalide'),
  city: z.string().min(2, 'Ville requise'),
  country: z.string().default('FR'),
});

export const consentsSchema = z.object({
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter les conditions generales' }) }),
  acceptDataProcessing: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter le traitement des donnees' }) }),
  certifyAccuracy: z.literal(true, { errorMap: () => ({ message: 'Vous devez certifier l\'exactitude des informations' }) }),
  retractationExecution: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter l\'execution immediate' }) }),
  retractationRenonciation: z.literal(true, { errorMap: () => ({ message: 'Vous devez renoncer au droit de retractation' }) }),
});

// ============================================================
// SCHEMA COMPLET
// ============================================================

export const registrationCertificateSchema = z.object({
  operation: operationSchema,
  holder: holderSchema,
  coOwner: coOwnerSchema.optional(),
  vehicle: vehicleSchema,
  // Champs demandeur (memes que les autres formulaires)
  requesterLastName: z.string().min(2, 'Nom requis'),
  requesterFirstName: z.string().min(2, 'Prenom requis'),
  email: z.string().email('Email invalide'),
  emailConfirm: z.string().email('Email invalide'),
  telephone: z.string().min(1, 'Telephone requis'),
  deliveryAddress: deliveryAddressSchema,
  consents: consentsSchema,
}).refine(
  (data) => {
    // Duplicata doit avoir un motif
    if (data.operation.typeId === 3 && data.operation.duplicateReason === undefined) {
      return false;
    }
    return true;
  },
  { message: 'Motif du duplicata requis', path: ['operation', 'duplicateReason'] }
);

export type RegistrationCertificateInput = z.infer<typeof registrationCertificateSchema>;

// ============================================================
// VALIDATION PAR ETAPE
// ============================================================

export const STEP_FIELDS: Record<string, (keyof RegistrationCertificateInput)[]> = {
  operation: ['operation'],
  holder: ['holder'],
  vehicle: ['vehicle'],
  requester: ['requesterLastName', 'requesterFirstName', 'email', 'emailConfirm', 'telephone', 'deliveryAddress'],
  summary: ['consents'],
};

// ============================================================
// MAPPING ADVERCITY
// ============================================================

export function mapToAdvercityPayload(input: RegistrationCertificateInput) {
  return {
    // Process (parent) - Demandeur
    claimerGender: input.holder.civility,
    claimerFirstName: input.requesterFirstName,
    claimerLastName: input.requesterLastName,
    claimerEmail: input.email,
    claimerPhone: input.telephone,
    claimerAddress: input.deliveryAddress.street,
    claimerZipcode: input.deliveryAddress.zipCode,
    claimerCityName: input.deliveryAddress.city,

    // ProcessRegistrationCertificate - Titulaire
    holderGender: input.holder.civility,
    holderFirstName: input.holder.firstName,
    holderLastName: input.holder.lastName,
    holderBirthDate: input.holder.birthDate,
    holderBirthCity: input.holder.birthCityName,
    holderBirthCountryId: 1, // France par defaut
    holderAddress: input.holder.address,
    holderAdditionalAddress: input.holder.additionalAddress,
    holderZipcode: input.holder.zipCode,
    holderCityName: input.holder.city,
    holderCompany: input.holder.companyName,
    holderSiren: input.holder.siren,

    // Co-titulaire
    holderCoOwnerFirstName: input.coOwner?.firstName,
    holderCoOwnerLastName: input.coOwner?.lastName,

    // Vehicule
    vehicleRegistrationNumber: input.vehicle.registrationNumber,
    vehicleTypeId: input.vehicle.vehicleTypeId,
    vehicleEnergyId: input.vehicle.energyId,
    vehiclePower: input.vehicle.fiscalPower,
    vehicleCO2: input.vehicle.co2,
    vehicleState: input.vehicle.state,
    vehicleRegistrationDateFirst: input.vehicle.registrationDate,
    vehicleTechnicalControl: input.vehicle.technicalControlDate,

    // Operation
    typeId: input.operation.typeId,
    duplicateReason: input.operation.duplicateReason,
    maxAddressChange: input.operation.maxAddressChange,
  };
}
