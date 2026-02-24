// Page de demande de desabonnement

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, Button, Input, Alert } from '@/components/ui';

export default function UnsubscribePage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/unsubscribe/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link href="/" className="flex justify-center">
            <span className="text-2xl font-bold text-blue-600">Espace Abo</span>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Email envoye
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <Card>
            <CardContent className="py-8 px-6">
              <Alert variant="success" className="mb-4">
                Si un abonnement actif est associe a l'adresse <strong>{email}</strong>, vous recevrez un email avec un lien pour confirmer la resiliation.
              </Alert>

              <p className="text-sm text-gray-600 mb-4">
                Verifiez votre boite de reception et vos spams. Le lien contenu dans l'email vous permettra de confirmer votre demande.
              </p>

              <Link href="/">
                <Button variant="outline" className="w-full">
                  Retour a l'accueil
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <span className="text-2xl font-bold text-blue-600">Espace Abo</span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Se desabonner
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Entrez l'adresse email associee a votre abonnement pour recevoir un lien de resiliation.
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
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="votre@email.com"
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Envoi en cours...' : 'Recevoir le lien de resiliation'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Retour a l'accueil
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
