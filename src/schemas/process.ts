// Schemas Zod pour les demarches

import { z } from 'zod';

// Types de demarches
export const processTypeSchema = z.enum([
  // Etat civil
  'CIVIL_STATUS_BIRTH',
  'CIVIL_STATUS_MARRIAGE',
  'CIVIL_STATUS_DEATH',
  // Vehicule
  'REGISTRATION_CERT',
  'NON_PLEDGE_CERT',
  'CRITAIR',
  // Identite
  'IDENTITY_CARD',
  'PASSPORT',
  'DRIVING_LICENCE',
  // Entreprise
  'KBIS',
  // Logement
  'ADDRESS_CHANGE',
  'CADASTRE',
  // Justice
  'CRIMINAL_RECORD',
  // Vie locale
  'SIGNALEMENT_MAIRIE',
]);

// Statuts de demarches
export const processStatusSchema = z.enum([
  'DRAFT',
  'PENDING_DOCUMENTS',
  'PENDING_PAYMENT',
  'PAYMENT_PROCESSING',
  'PAYMENT_FAILED',
  'PAID',
  'SENT_TO_ADVERCITY',
  'IN_PROGRESS',
  'AWAITING_INFO',
  'COMPLETED',
  'REFUNDED',
  'CANCELED',
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
  'CARTE_GRISE',
  'CERTIFICAT_CESSION',
  'CERTIFICAT_NON_GAGE',
  'CONTROLE_TECHNIQUE',
  'MANDAT',
  'DECLARATION_PERTE',
  'AUTRE',
]);

// Statut validation document
export const documentValidationStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
]);

// Schema upload fichier
export const uploadFileSchema = z.object({
  fileType: fileTypeSchema,
});

export type UploadFileSchema = z.infer<typeof uploadFileSchema>;

// Schema checkout demarche
export const processCheckoutSchema = z.object({
  type: processTypeSchema,
  data: z.record(z.any()),
  processReference: z.string().optional(),
  paymentMode: z.enum(['one_time', 'subscription']).default('one_time'),
  stampTaxCents: z.number().int().min(0).max(100000).default(0),
  isFromSubscription: z.boolean().default(false),
  isFreeProfile: z.boolean().default(false),
  partner: z.string().nullable().default(null),
  pricingCode: z.string().nullable().default(null),
  source: z.string().nullable().default(null),
});

export type ProcessCheckoutSchema = z.infer<typeof processCheckoutSchema>;

// Schema annulation abonnement
export const cancelSubscriptionSchema = z.object({
  reason: z.string().max(1000).optional(),
  immediate: z.boolean().default(false),
});

export type CancelSubscriptionSchema = z.infer<typeof cancelSubscriptionSchema>;

// Schema checkout abonnement
export const subscriptionCheckoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID requis').regex(/^price_/, 'Price ID invalide'),
});

export type SubscriptionCheckoutSchema = z.infer<typeof subscriptionCheckoutSchema>;
