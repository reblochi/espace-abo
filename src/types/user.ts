// Types pour les utilisateurs

export interface User {
  id: string;
  email: string;
  emailVerified: string | null;
  gender: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  birthDate: string | null;
  address: string | null;
  addressExtra: string | null;
  zipCode: string | null;
  city: string | null;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  addressExtra: string | null;
  zipCode: string | null;
  city: string | null;
  createdAt: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  addressExtra?: string;
  zipCode?: string;
  city?: string;
}

export interface ChangePasswordInput {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}

// Session NextAuth etendue
export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}
