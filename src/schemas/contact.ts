import { z } from 'zod';

export const contactSubjectValues = [
  'DEMARCHE',
  'ABONNEMENT',
  'TECHNIQUE',
  'SIGNALEMENT',
  'RETRACTATION',
  'DONNEES',
  'AUTRE',
] as const;

export const contactSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  email: z.string().email('Adresse email invalide'),
  subject: z.enum(contactSubjectValues),
  processReference: z.string().optional(),
  message: z.string().min(10, 'Message trop court (10 caractères minimum)'),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const contactSubjectLabels: Record<typeof contactSubjectValues[number], string> = {
  DEMARCHE: 'Question sur une démarche',
  ABONNEMENT: 'Abonnement / Facturation',
  TECHNIQUE: 'Problème technique',
  SIGNALEMENT: 'Signalement citoyen',
  RETRACTATION: 'Droit de rétractation',
  DONNEES: 'Mes données personnelles',
  AUTRE: 'Autre',
};

export const messageReplySchema = z.object({
  type: z.enum(['process', 'contact']),
  id: z.string().min(1),
  message: z.string().min(1, 'Message requis'),
});

export type MessageReplyInput = z.infer<typeof messageReplySchema>;
