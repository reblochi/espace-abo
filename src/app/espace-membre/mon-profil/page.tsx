// Page Mon Profil

'use client';

import { useState, useEffect } from 'react';
import { useProfile, useAuth } from '@/hooks';
import { useCountries } from '@/hooks/useCountries';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Select,
  Alert,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { CityAutocomplete, type City } from '@/components/forms';
import { PostalCityAutocomplete } from '@/components/forms/PostalCityAutocomplete';
import { FRANCE_COUNTRY_ID } from '@/types/birth-certificate';

function RgpdSection() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isAnonymizing, setIsAnonymizing] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  const handleAnonymize = async () => {
    setIsAnonymizing(true);
    setResult(null);
    try {
      const res = await fetch('/api/account/anonymize', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setResult({ success: true });
      setShowConfirm(false);
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : 'Erreur inconnue' });
    } finally {
      setIsAnonymizing(false);
    }
  };

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle>Donnees personnelles (RGPD)</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500 mb-2">
          Conformement au RGPD, vous pouvez demander l&apos;effacement des donnees
          de traitement de vos demarches (formulaires, documents uploades).
        </p>
        <p className="text-gray-500 mb-4 text-sm">
          Vos informations d&apos;identification (nom, email, adresse) et vos factures
          sont conservees pour des raisons legales et comptables (10 ans, art. L123-22 Code de commerce).
        </p>

        {result?.success && (
          <Alert variant="success" className="mb-4">
            Vos donnees de traitement ont ete anonymisees avec succes.
          </Alert>
        )}
        {result?.error && (
          <Alert variant="error" className="mb-4">
            {result.error}
          </Alert>
        )}

        {!showConfirm ? (
          <Button variant="outline" onClick={() => setShowConfirm(true)}>
            Anonymiser mes donnees de traitement
          </Button>
        ) : (
          <div className="p-4 bg-orange-50 rounded-lg space-y-3">
            <p className="text-sm font-medium text-orange-800">
              Cette action est irreversible. Les donnees de formulaires et documents
              de toutes vos demarches seront effaces.
            </p>
            <p className="text-sm text-orange-700">
              Vos factures, votre abonnement et vos informations de contact seront conserves.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleAnonymize}
                disabled={isAnonymizing}
              >
                {isAnonymizing ? 'Anonymisation...' : 'Confirmer l\'anonymisation'}
              </Button>
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MonProfilPage() {
  const { user, logout } = useAuth();
  const { profile, isLoading, updateProfileAsync, isUpdating } = useProfile();

  const { countriesWithFrance } = useCountries();
  const [birthCity, setBirthCity] = useState<City | null>(null);

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    birthCountryId: FRANCE_COUNTRY_ID as number,
    birthCityId: undefined as number | undefined,
    birthCityName: '',
    address: '',
    city: '',
    zipCode: '',
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

  // Initialiser le formulaire quand le profil est chargé
  useEffect(() => {
    if (profile) {
      const bd = profile.birthDate ? new Date(profile.birthDate).toISOString().split('T')[0] : '';
      setProfileForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        birthDate: bd,
        birthCountryId: profile.birthCountryId || FRANCE_COUNTRY_ID,
        birthCityId: profile.birthCityId || undefined,
        birthCityName: profile.birthCityName || '',
        address: profile.address || '',
        city: profile.city || '',
        zipCode: profile.zipCode || '',
      });
      if (profile.birthCityId && profile.birthCityName) {
        setBirthCity({ id: profile.birthCityId, name: profile.birthCityName, postal_code: '', department_code: '' });
      }
    }
  }, [profile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    try {
      await updateProfileAsync(profileForm);
      setProfileSuccess(true);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la mise a jour.');
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
        <p className="text-gray-500 mt-1">Gérez vos informations personnelles</p>
      </div>

      <Tabs defaultValue="informations">
        <TabsList>
          <TabsTrigger value="informations">Informations</TabsTrigger>
          <TabsTrigger value="securite">Sécurité</TabsTrigger>
        </TabsList>

        {/* Onglet Informations */}
        <TabsContent value="informations">
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {profileSuccess && (
              <Alert variant="success">
                Vos informations ont ete mises a jour avec succes.
              </Alert>
            )}
            {profileError && (
              <Alert variant="error">
                {profileError}
              </Alert>
            )}

            {/* Identite */}
            <Card>
              <CardHeader>
                <CardTitle>Identite</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  label="Date de naissance"
                  type="date"
                  value={profileForm.birthDate}
                  onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                />
              </CardContent>
            </Card>

            {/* Lieu de naissance */}
            <Card>
              <CardHeader>
                <CardTitle>Lieu de naissance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="Pays de naissance"
                  value={profileForm.birthCountryId === FRANCE_COUNTRY_ID ? '' : String(profileForm.birthCountryId || '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setProfileForm({ ...profileForm, birthCountryId: FRANCE_COUNTRY_ID, birthCityId: undefined, birthCityName: '' });
                    } else {
                      setProfileForm({ ...profileForm, birthCountryId: parseInt(val, 10), birthCityId: undefined, birthCityName: '' });
                    }
                    setBirthCity(null);
                  }}
                >
                  {countriesWithFrance.map((c) => (
                    <option key={c.id} value={c.id === 0 ? '' : String(c.id)}>{c.label}</option>
                  ))}
                </Select>

                {profileForm.birthCountryId === FRANCE_COUNTRY_ID ? (
                  <CityAutocomplete
                    label="Commune de naissance"
                    variant="default"
                    value={birthCity}
                    onChange={(city) => {
                      setBirthCity(city);
                      if (city) {
                        setProfileForm({ ...profileForm, birthCityId: city.id, birthCityName: city.name });
                      } else {
                        setProfileForm({ ...profileForm, birthCityId: undefined, birthCityName: '' });
                      }
                    }}
                  />
                ) : (
                  <Input
                    label="Ville de naissance"
                    value={profileForm.birthCityName}
                    onChange={(e) => setProfileForm({ ...profileForm, birthCityName: e.target.value, birthCityId: undefined })}
                  />
                )}
              </CardContent>
            </Card>

            {/* Coordonnees */}
            <Card>
              <CardHeader>
                <CardTitle>Coordonnees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  placeholder="06 12 34 56 78"
                />
              </CardContent>
            </Card>

            {/* Adresse */}
            <Card>
              <CardHeader>
                <CardTitle>Adresse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Adresse"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Numero et nom de rue"
                />
                <PostalCityAutocomplete
                  cpValue={profileForm.zipCode}
                  cityValue={profileForm.city}
                  onCpChange={(value) => setProfileForm({ ...profileForm, zipCode: value })}
                  onCityChange={(value) => setProfileForm({ ...profileForm, city: value })}
                  variant="default"
                />
              </CardContent>
            </Card>

            <Button type="submit" disabled={isUpdating} className="w-full sm:w-auto">
              {isUpdating ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </form>
        </TabsContent>

        {/* Onglet Sécurité */}
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

            {/* RGPD */}
            <RgpdSection />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
