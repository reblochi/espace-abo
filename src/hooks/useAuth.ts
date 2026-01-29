// Hook pour l'authentification

'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';
import type { RegisterSchema, LoginSchema } from '@/schemas';

export function useAuth() {
  const { data: session, status, update } = useSession();

  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';
  const user = session?.user;

  // Connexion avec credentials
  const login = async (data: LoginSchema) => {
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error);
    }

    return result;
  };

  // Deconnexion
  const logout = async (callbackUrl = '/') => {
    await signOut({ callbackUrl });
  };

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateSession: update,
  };
}

// Hook pour l'inscription
export function useRegister() {
  return useMutation({
    mutationFn: async (data: RegisterSchema) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur inscription');
      }

      return response.json();
    },
  });
}

// Hook pour demander un reset de mot de passe
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur envoi email');
      }

      return response.json();
    },
  });
}

// Hook pour reset le mot de passe avec token
export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur reset mot de passe');
      }

      return response.json();
    },
  });
}
