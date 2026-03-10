// Page Services utiles

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input } from '@/components/ui';
import { showComingSoonToast, ComingSoonBadge, ComingSoonSection } from '@/components/ui/coming-soon';

interface ServiceCard {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  hours: string;
  icon: string;
}

const mockServices: ServiceCard[] = [
  {
    id: '1',
    name: 'Mairie de Fridefont',
    category: 'Mairie',
    address: '1 Place de la Mairie, 15110 Fridefont',
    phone: '04 71 23 45 67',
    hours: 'Lun-Ven 9h-12h / 14h-17h',
    icon: '🏛️',
  },
  {
    id: '2',
    name: 'Prefecture du Cantal',
    category: 'Prefecture',
    address: 'Cours Monthyon, 15000 Aurillac',
    phone: '04 71 46 23 00',
    hours: 'Lun-Ven 8h30-12h / 13h30-16h30',
    icon: '🏢',
  },
  {
    id: '3',
    name: 'CAF du Cantal',
    category: 'CAF',
    address: '10 Rue de Salers, 15000 Aurillac',
    phone: '3230',
    hours: 'Lun-Ven 9h-16h30',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    id: '4',
    name: 'CPAM du Cantal',
    category: 'CPAM',
    address: '15 Avenue de la Republique, 15000 Aurillac',
    phone: '3646',
    hours: 'Lun-Ven 8h30-16h',
    icon: '🏥',
  },
  {
    id: '5',
    name: 'Bureau de Poste Aurillac',
    category: 'La Poste',
    address: '8 Rue du 4 Septembre, 15000 Aurillac',
    phone: '3631',
    hours: 'Lun-Ven 9h-18h / Sam 9h-12h',
    icon: '📮',
  },
];

const comparators = [
  { title: 'Prix du carburant', description: 'Trouvez la station la moins chere pres de chez vous', icon: '⛽' },
  { title: 'Offres internet', description: 'Comparez les box internet disponibles a votre adresse', icon: '📶' },
  { title: 'Assurance auto', description: 'Comparez les offres d\'assurance automobile', icon: '🚗' },
];

export default function ServicesPage() {
  const [search, setSearch] = useState('');

  const filteredServices = search
    ? mockServices.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase())
      )
    : mockServices;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Services utiles</h1>
        <p className="text-gray-500 mt-1">
          Trouvez les administrations et services pres de chez vous
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un service (mairie, prefecture, CAF...)"
          className="pl-10"
        />
      </div>

      {/* Fiches administrations */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filteredServices.map(service => (
          <Card key={service.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">{service.icon}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{service.name}</h3>
                  <Badge variant="secondary">{service.category}</Badge>
                </div>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-600">{service.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-600">{service.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-600">{service.hours}</span>
                </div>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparateurs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>Comparateurs</CardTitle>
            <ComingSoonBadge />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {comparators.map(comp => (
              <button
                key={comp.title}
                onClick={() => showComingSoonToast()}
                className="text-left p-4 border rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-colors"
              >
                <span className="text-2xl mb-2 block">{comp.icon}</span>
                <h4 className="font-medium text-gray-900 text-sm mb-1">{comp.title}</h4>
                <p className="text-xs text-gray-500">{comp.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assistant IA */}
      <ComingSoonSection
        title="Assistant IA"
        description="Posez vos questions administratives a notre assistant intelligent."
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
      />
    </div>
  );
}
