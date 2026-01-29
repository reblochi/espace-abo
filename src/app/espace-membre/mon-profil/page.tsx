// Page Mon Profil

'use client';

import { useState } from 'react';
import { useProfile, useAuth } from '@/hooks';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Alert,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';

export default function MonProfilPage() {
  const { user, logout } = useAuth();
  const { profile, isLoading, updateProfile, isUpdating } = useProfile();

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Initialiser le formulaire avec les donnees du profil
  useState(() => {
    if (profile) {
      setProfileForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        postalCode: profile.zipCode || '',
      });
    }
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    try {
      await updateProfile(profileForm);
      setProfileSuccess(true);
    } catch (error) {
      setProfileError('Une erreur est survenue lors de la mise a jour.');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caracteres.');
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors du changement de mot de passe');
      }

      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <p className="text-gray-500 mt-1">Gerez vos informations personnelles</p>
      </div>

      <Tabs defaultValue="informations">
        <TabsList>
          <TabsTrigger value="informations">Informations</TabsTrigger>
          <TabsTrigger value="securite">Securite</TabsTrigger>
        </TabsList>

        {/* Onglet Informations */}
        <TabsContent value="informations">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent>
              {profileSuccess && (
                <Alert variant="success" className="mb-4">
                  Vos informations ont ete mises a jour avec succes.
                </Alert>
              )}
              {profileError && (
                <Alert variant="error" className="mb-4">
                  {profileError}
                </Alert>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Prenom"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    required
                  />
                  <Input
                    label="Nom"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    required
                  />
                </div>

                <Input
                  label="Email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                />

                <Input
                  label="Telephone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />

                <Input
                  label="Adresse"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Ville"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  />
                  <Input
                    label="Code postal"
                    value={profileForm.postalCode}
                    onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Securite */}
        <TabsContent value="securite">
          <div className="space-y-6">
            {/* Changement de mot de passe */}
            <Card>
              <CardHeader>
                <CardTitle>Changer le mot de passe</CardTitle>
              </CardHeader>
              <CardContent>
                {passwordSuccess && (
                  <Alert variant="success" className="mb-4">
                    Votre mot de passe a ete modifie avec succes.
                  </Alert>
                )}
                {passwordError && (
                  <Alert variant="error" className="mb-4">
                    {passwordError}
                  </Alert>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <Input
                    label="Mot de passe actuel"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />

                  <Input
                    label="Nouveau mot de passe"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                  />

                  <Input
                    label="Confirmer le nouveau mot de passe"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />

                  <div className="pt-4">
                    <Button type="submit">
                      Modifier le mot de passe
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Session */}
            <Card>
              <CardHeader>
                <CardTitle>Session</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-4">
                  Connecte en tant que <strong>{user?.email}</strong>
                </p>
                <Button variant="outline" onClick={() => logout()}>
                  Se deconnecter
                </Button>
              </CardContent>
            </Card>

            {/* Suppression de compte */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Zone de danger</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-4">
                  La suppression de votre compte est irreversible. Toutes vos donnees seront perdues.
                </p>
                <Button variant="destructive">
                  Supprimer mon compte
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
