// Page Ma Famille - CRUD membres de la famille

'use client';

import { useState } from 'react';
import { useFamily } from '@/hooks';
import { useCountries } from '@/hooks/useCountries';
import {
  Card, CardHeader, CardTitle, CardContent,
  Button, Badge, Modal, Input, Select, Alert, Spinner,
} from '@/components/ui';
import { CityAutocomplete, type City } from '@/components/forms';
import { PostalCityAutocomplete } from '@/components/forms/PostalCityAutocomplete';
import { FRANCE_COUNTRY_ID } from '@/types/birth-certificate';
import type { FamilyMember, FamilyMemberInput } from '@/types';

const RELATIONS = [
  { value: 'conjoint', label: 'Conjoint(e)' },
  { value: 'enfant', label: 'Enfant' },
  { value: 'parent', label: 'Parent' },
  { value: 'frere_soeur', label: 'Frere/Soeur' },
  { value: 'autre', label: 'Autre' },
];

const relationLabel = (r: string) => RELATIONS.find((x) => x.value === r)?.label || r;

const formatDate = (d: string | null) => {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return d; }
};

const getInitials = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];

const emptyForm: FamilyMemberInput = {
  relation: '',
  gender: null,
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  birthDate: '',
  birthCountryId: FRANCE_COUNTRY_ID,
  birthCityId: undefined,
  birthCityName: '',
  address: '',
  zipCode: '',
  city: '',
};

export default function MaFamillePage() {
  const { members, isLoading, createMember, updateMember, deleteMember, isCreating, isUpdating, isDeleting } = useFamily();
  const { countriesWithFrance } = useCountries();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FamilyMemberInput>({ ...emptyForm });
  const [birthCity, setBirthCity] = useState<City | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setBirthCity(null);
    setError(null);
    setShowModal(true);
  };

  const openEdit = (member: FamilyMember) => {
    setEditingId(member.id);
    setForm({
      relation: member.relation,
      gender: member.gender,
      firstName: member.firstName,
      lastName: member.lastName,
      phone: member.phone || '',
      email: member.email || '',
      birthDate: member.birthDate ? new Date(member.birthDate).toISOString().split('T')[0] : '',
      birthCountryId: member.birthCountryId || FRANCE_COUNTRY_ID,
      birthCityId: member.birthCityId || undefined,
      birthCityName: member.birthCityName || '',
      address: member.address || '',
      zipCode: member.zipCode || '',
      city: member.city || '',
    });
    setBirthCity(
      member.birthCityId && member.birthCityName
        ? { id: member.birthCityId, name: member.birthCityName, postal_code: '', department_code: '' }
        : null
    );
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.relation || !form.firstName || !form.lastName) {
      setError('Prenom, nom et lien de parente sont requis.');
      return;
    }

    try {
      if (editingId) {
        await updateMember({ id: editingId, data: form });
      } else {
        await createMember(form);
      }
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMember(id);
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const isFrance = (form.birthCountryId || FRANCE_COUNTRY_ID) === FRANCE_COUNTRY_ID;
  const isSaving = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ma famille</h1>
          <p className="text-gray-500 mt-1">Gerez les membres de votre foyer</p>
        </div>
        <Button onClick={openAdd}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Ajouter un membre
        </Button>
      </div>

      {/* Liste vide */}
      {members.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 mb-4">Aucun membre de la famille pour le moment.</p>
            <Button onClick={openAdd}>Ajouter un membre</Button>
          </CardContent>
        </Card>
      )}

      {/* Liste des membres */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member, index) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full ${colors[index % colors.length]} flex items-center justify-center text-white font-semibold text-lg`}>
                  {getInitials(member.firstName, member.lastName)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {member.firstName} {member.lastName}
                  </h3>
                  <Badge variant="secondary">{relationLabel(member.relation)}</Badge>
                </div>
              </div>
              <dl className="space-y-2 text-sm">
                {member.birthDate && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Naissance</dt>
                    <dd className="text-gray-900">
                      {formatDate(member.birthDate)}
                      {member.birthCityName && ` a ${member.birthCityName}`}
                    </dd>
                  </div>
                )}
                {member.email && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Email</dt>
                    <dd className="text-gray-900 truncate ml-2">{member.email}</dd>
                  </div>
                )}
                {member.phone && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Telephone</dt>
                    <dd className="text-gray-900">{member.phone}</dd>
                  </div>
                )}
                {member.city && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Ville</dt>
                    <dd className="text-gray-900">{member.zipCode} {member.city}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-4 pt-3 border-t flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(member)}>
                  Modifier
                </Button>
                {deleteConfirm === member.id ? (
                  <div className="flex gap-1">
                    <Button variant="destructive" size="sm" disabled={isDeleting} onClick={() => handleDelete(member.id)}>
                      Oui
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>
                      Non
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(member.id)}>
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal ajout/edition */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Modifier un membre' : 'Ajouter un membre'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <Alert variant="error">{error}</Alert>}

          {/* Relation */}
          <Select
            label="Lien de parente *"
            value={form.relation}
            onChange={(e) => setForm({ ...form, relation: e.target.value })}
          >
            <option value="">Selectionnez...</option>
            {RELATIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>

          {/* Identite */}
          <div className="pt-2 border-t">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Identite</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Civilite</label>
                <div className="flex gap-3">
                  {[{ value: 'MALE', label: 'Monsieur' }, { value: 'FEMALE', label: 'Madame' }].map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setForm({ ...form, gender: g.value })}
                      className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition-colors ${
                        form.gender === g.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Prenom *" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                <Input label="Nom *" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </div>
              <Input label="Date de naissance" type="date" value={form.birthDate || ''} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
            </div>
          </div>

          {/* Lieu de naissance */}
          <div className="pt-2 border-t">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Lieu de naissance</h3>
            <div className="space-y-3">
              <Select
                label="Pays de naissance"
                value={isFrance ? '' : String(form.birthCountryId || '')}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setForm({ ...form, birthCountryId: FRANCE_COUNTRY_ID, birthCityId: undefined, birthCityName: '' });
                  } else {
                    setForm({ ...form, birthCountryId: parseInt(val, 10), birthCityId: undefined, birthCityName: '' });
                  }
                  setBirthCity(null);
                }}
              >
                {countriesWithFrance.map((c) => (
                  <option key={c.id} value={c.id === 0 ? '' : String(c.id)}>{c.label}</option>
                ))}
              </Select>

              {isFrance ? (
                <CityAutocomplete
                  label="Commune de naissance"
                  variant="default"
                  value={birthCity}
                  onChange={(city) => {
                    setBirthCity(city);
                    if (city) {
                      setForm({ ...form, birthCityId: city.id, birthCityName: city.name });
                    } else {
                      setForm({ ...form, birthCityId: undefined, birthCityName: '' });
                    }
                  }}
                />
              ) : (
                <Input
                  label="Ville de naissance"
                  value={form.birthCityName || ''}
                  onChange={(e) => setForm({ ...form, birthCityName: e.target.value, birthCityId: undefined })}
                />
              )}
            </div>
          </div>

          {/* Coordonnees */}
          <div className="pt-2 border-t">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Coordonnees</h3>
            <div className="space-y-3">
              <Input label="Email" type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Telephone" type="tel" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="06 12 34 56 78" />
            </div>
          </div>

          {/* Adresse */}
          <div className="pt-2 border-t">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Adresse</h3>
            <div className="space-y-3">
              <Input label="Adresse" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Numero et nom de rue" />
              <PostalCityAutocomplete
                cpValue={form.zipCode || ''}
                cityValue={form.city || ''}
                onCpChange={(value) => setForm({ ...form, zipCode: value })}
                onCityChange={(value) => setForm({ ...form, city: value })}
                variant="default"
              />
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-3 border-t">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
