// Page d'inscription

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, Button, Input, Alert, Logo } from '@/components/ui';

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    acceptTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validations
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caracteres');
      setIsLoading(false);
      return;
    }

    if (!formData.acceptTerms) {
      setError('Vous devez accepter les conditions generales');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      // Rediriger vers la connexion avec un message de succes
      router.push('/login?registered=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Creer un compte
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Deja un compte ?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Se connecter
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="py-8 px-6">
            {error && (
              <Alert variant="error" className="mb-4">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Prenom"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Nom"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>

              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />

              <Input
                label="Mot de passe"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />

              <Input
                label="Confirmer le mot de passe"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />

              <div className="flex items-start">
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                />
                <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-600">
                  J'accepte les{' '}
                  <Link href="/conditions-generales" className="text-blue-600 hover:text-blue-500">
                    conditions generales d'utilisation
                  </Link>
                  {' '}et la{' '}
                  <Link href="/politique-confidentialite" className="text-blue-600 hover:text-blue-500">
                    politique de confidentialite
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Creation du compte...' : 'Creer mon compte'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
