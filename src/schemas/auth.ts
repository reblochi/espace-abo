// Schemas Zod pour l'authentification

import { z } from 'zod';

// Schema inscription
export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caracteres'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'Prenom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export type RegisterSchema = z.infer<typeof registerSchema>;

// Schema connexion
export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export type LoginSchema = z.infer<typeof loginSchema>;

// Schema changement mot de passe
export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;

// Schema reset mot de passe (demande)
export const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

// Schema reset mot de passe (confirmation)
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

// Schema profil
export const profileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  gender: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  birthCountryId: z.number().int().optional().nullable(),
  birthCityId: z.number().int().optional().nullable(),
  birthCityName: z.string().optional().nullable(),
  address: z.string().optional(),
  addressExtra: z.string().optional(),
  zipCode: z.string().optional(),
  city: z.string().optional(),
});

export type ProfileSchema = z.infer<typeof profileSchema>;
