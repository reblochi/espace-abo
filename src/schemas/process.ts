// Schemas Zod pour les demarches

import { z } from 'zod';

// Types de demarches
export const processTypeSchema = z.enum([
  'CIVIL_STATUS_BIRTH',
  'CIVIL_STATUS_MARRIAGE',
  'CIVIL_STATUS_DEATH',
  'CRIMINAL_RECORD',
  'REGISTRATION_CERT',
  'KBIS',
  'ADDRESS_CHANGE',
  'NON_PLEDGE_CERT',
  'PASSPORT',
  'IDENTITY_CARD',
  'CADASTRE',
  'CRITAIR',
]);

// Types d'actes
export const actTypeSchema = z.enum([
  'FULL_COPY',
  'EXTRACT_WITH_FILIATION',
  'EXTRACT_WITHOUT_FILIATION',
]);

// Adresse de livraison
export const deliveryAddressSchema = z.object({
  street: z.string().min(1, 'Adresse requise'),
  zipCode: z.string().min(5, 'Code postal requis (5 chiffres)').max(5),
  city: z.string().min(1, 'Ville requise'),
  country: z.string().default('FR'),
});

// Donnees demarche etat civil
export const civilStatusDataSchema = z.object({
  // Beneficiaire
  beneficiaryFirstName: z.string().min(1, 'Prenom du beneficiaire requis'),
  beneficiaryLastName: z.string().min(1, 'Nom du beneficiaire requis'),
  beneficiaryBirthDate: z.string().min(1, 'Date de naissance requise'),

  // Evenement
  eventDate: z.string().min(1, 'Date de l\'evenement requise'),
  eventCityId: z.number().int().positive('ID commune requis'),
  eventCityName: z.string().min(1, 'Nom de la commune requis'),

  // Type d'acte
  actType: actTypeSchema,

  // Livraison
  deliveryAddress: deliveryAddressSchema,
});

// Schema creation demarche complet
export const createProcessSchema = z.object({
  type: processTypeSchema,
  data: civilStatusDataSchema,
  isFromSubscription: z.boolean().default(false),
  stripeSessionId: z.string().optional(),
});

export type CreateProcessSchema = z.infer<typeof createProcessSchema>;
export type CivilStatusDataSchema = z.infer<typeof civilStatusDataSchema>;
export type DeliveryAddressSchema = z.infer<typeof deliveryAddressSchema>;

// Types de fichiers
export const fileTypeSchema = z.enum([
  'CNI',
  'PASSEPORT',
  'PERMIS',
  'JUSTIFICATIF_DOMICILE',
  'PHOTO_IDENTITE',
  'ACTE_NAISSANCE',
  'LIVRET_FAMILLE',
  'AUTRE',
]);

// Schema upload fichier
export const uploadFileSchema = z.object({
  fileType: fileTypeSchema,
});

export type UploadFileSchema = z.infer<typeof uploadFileSchema>;
