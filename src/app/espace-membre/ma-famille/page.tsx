// Page Ma Famille

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, Input } from '@/components/ui';
import { showComingSoonToast, ComingSoonSection } from '@/components/ui/coming-soon';

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  relation: string;
  birthDate: string;
  email?: string;
  phone?: string;
}

const mockFamily: FamilyMember[] = [
  { id: '1', firstName: 'Marie', lastName: 'Dupont', relation: 'Conjoint(e)', birthDate: '1990-05-12', email: 'marie.dupont@email.com', phone: '06 12 34 56 78' },
  { id: '2', firstName: 'Lucas', lastName: 'Dupont', relation: 'Enfant', birthDate: '2015-09-03' },
  { id: '3', firstName: 'Emma', lastName: 'Dupont', relation: 'Enfant', birthDate: '2018-11-21' },
];

const getInitials = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];

export default function MaFamillePage() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ma famille</h1>
          <p className="text-gray-500 mt-1">
            Gerez les membres de votre foyer
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Ajouter un membre
        </Button>
      </div>

      {/* Liste des membres */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockFamily.map((member, index) => (
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
                  <Badge variant="secondary">{member.relation}</Badge>
                </div>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Date de naissance</dt>
                  <dd className="text-gray-900">{member.birthDate}</dd>
                </div>
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
              </dl>
              <div className="mt-4 pt-3 border-t flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => showComingSoonToast()}>
                  Modifier
                </Button>
                <Button variant="ghost" size="sm" onClick={() => showComingSoonToast()}>
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calculer mes aides */}
      <ComingSoonSection
        title="Calculer mes aides"
        description="Estimez les aides auxquelles votre foyer a droit en fonction de votre composition familiale."
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        }
      />

      {/* Modal ajouter un membre */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Ajouter un membre de la famille" size="md">
        <form onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); showComingSoonToast(); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prenom</label>
              <Input placeholder="Prenom" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <Input placeholder="Nom" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lien de parente</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option>Conjoint(e)</option>
              <option>Enfant</option>
              <option>Parent</option>
              <option>Frere/Soeur</option>
              <option>Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
            <Input type="date" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (optionnel)</label>
            <Input type="email" placeholder="email@exemple.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telephone (optionnel)</label>
            <Input type="tel" placeholder="06 00 00 00 00" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              Ajouter
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
