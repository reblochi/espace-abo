// Schema Zod pour le signalement mairie (demarche gratuite)

import { z } from 'zod';

// Categories de signalement
export const signalementCategorySchema = z.enum([
  'voirie',
  'eclairage',
  'proprete',
  'espaces_verts',
  'stationnement',
  'nuisances',
  'securite',
  'autre',
], {
  required_error: 'Veuillez selectionner une categorie',
});

export type SignalementCategory = z.infer<typeof signalementCategorySchema>;

export const SIGNALEMENT_CATEGORIES = [
  { value: 'voirie' as const, label: 'Voirie et trottoirs', icon: '🚧', description: 'Nids-de-poule, trottoirs endommages, chaussee degradee...' },
  { value: 'eclairage' as const, label: 'Eclairage public', icon: '💡', description: 'Lampadaire en panne, eclairage insuffisant...' },
  { value: 'proprete' as const, label: 'Proprete et dechets', icon: '🗑️', description: 'Depots sauvages, poubelles debordantes, tags...' },
  { value: 'espaces_verts' as const, label: 'Espaces verts', icon: '🌳', description: 'Arbres dangereux, entretien des parcs, vegetation envahissante...' },
  { value: 'stationnement' as const, label: 'Stationnement', icon: '🅿️', description: 'Vehicules ventouses, stationnement genant...' },
  { value: 'nuisances' as const, label: 'Bruit et nuisances', icon: '🔊', description: 'Nuisances sonores, odeurs, troubles du voisinage...' },
  { value: 'securite' as const, label: 'Securite', icon: '⚠️', description: 'Danger sur la voie publique, signalisation manquante...' },
  { value: 'autre' as const, label: 'Autre', icon: '📋', description: 'Tout autre probleme a signaler a votre mairie' },
];

// Schema complet
export const signalementMairieSchema = z.object({
  // Etape 1: Categorie
  category: signalementCategorySchema,

  // Etape 2: Localisation
  zipCode: z.string().min(5, 'Code postal requis (5 chiffres)').max(5),
  city: z.string().min(1, 'Commune requise'),
  adresse: z.string().optional(),

  // Etape 3: Description
  description: z.string().min(10, 'La description doit contenir au moins 10 caracteres'),

  // Etape 4: Coordonnees (si non connecte)
  requesterFirstName: z.string().min(2, 'Prenom requis (minimum 2 caracteres)'),
  requesterLastName: z.string().min(2, 'Nom requis (minimum 2 caracteres)'),
  email: z.string().email('Email invalide'),
  emailConfirm: z.string().email('Email invalide'),
  telephone: z.string().optional(),

  // Consentements
  consents: z.object({
    acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter les conditions' }) }),
    acceptDataProcessing: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter le traitement des donnees' }) }),
  }),
});

export type SignalementMairieInput = z.infer<typeof signalementMairieSchema>;

// Champs par etape pour la validation incrementale
export const STEP_FIELDS: Record<string, (keyof SignalementMairieInput)[]> = {
  category: ['category'],
  location: ['zipCode', 'city'],
  description: ['description'],
  contact: ['requesterFirstName', 'requesterLastName', 'email', 'emailConfirm'],
  summary: ['consents'],
};
