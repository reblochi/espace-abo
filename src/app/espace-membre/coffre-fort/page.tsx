// Page Coffre-fort numerique

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Modal } from '@/components/ui';
import { showComingSoonToast } from '@/components/ui/coming-soon';

const categories = [
  { value: 'all', label: 'Tous' },
  { value: 'identité', label: 'Identite' },
  { value: 'etat-civil', label: 'Etat civil' },
  { value: 'vehicule', label: 'Vehicule' },
  { value: 'domicile', label: 'Domicile' },
  { value: 'sante', label: 'Sante' },
  { value: 'autre', label: 'Autre' },
];

type DocValidity = 'valid' | 'warning' | 'expired';

interface MockDocument {
  id: string;
  name: string;
  type: string;
  category: string;
  date: string;
  expiresAt?: string;
  validity: DocValidity;
  size: string;
}

const mockDocuments: MockDocument[] = [
  { id: '1', name: 'Carte d\'identité', type: 'PDF', category: 'identité', date: '2024-03-15', expiresAt: '2034-03-15', validity: 'valid', size: '2.4 Mo' },
  { id: '2', name: 'Passeport', type: 'PDF', category: 'identité', date: '2023-06-20', expiresAt: '2026-06-15', validity: 'warning', size: '3.1 Mo' },
  { id: '3', name: 'Permis de conduire', type: 'JPG', category: 'identité', date: '2020-01-10', expiresAt: '2025-01-10', validity: 'expired', size: '1.8 Mo' },
  { id: '4', name: 'Acte de naissance', type: 'PDF', category: 'etat-civil', date: '2024-11-05', validity: 'valid', size: '0.8 Mo' },
  { id: '5', name: 'Livret de famille', type: 'PDF', category: 'etat-civil', date: '2022-09-12', validity: 'valid', size: '1.2 Mo' },
  { id: '6', name: 'Carte grise Peugeot 308', type: 'PDF', category: 'vehicule', date: '2024-07-22', validity: 'valid', size: '1.5 Mo' },
  { id: '7', name: 'Attestation assurance habitation', type: 'PDF', category: 'domicile', date: '2025-01-01', expiresAt: '2026-01-01', validity: 'valid', size: '0.6 Mo' },
  { id: '8', name: 'Quittance de loyer - Mars 2026', type: 'PDF', category: 'domicile', date: '2026-03-01', validity: 'valid', size: '0.3 Mo' },
  { id: '9', name: 'Carte vitale', type: 'JPG', category: 'sante', date: '2024-05-10', validity: 'valid', size: '0.9 Mo' },
];

const validityConfig = {
  valid: { label: 'Valide', variant: 'success' as const, color: 'text-green-600' },
  warning: { label: 'Expire bientot', variant: 'warning' as const, color: 'text-yellow-600' },
  expired: { label: 'Expire', variant: 'destructive' as const, color: 'text-red-600' },
};

export default function CoffrefortPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const expiringDocs = mockDocuments.filter(d => d.validity === 'warning' || d.validity === 'expired');
  const filteredDocs = activeTab === 'all' ? mockDocuments : mockDocuments.filter(d => d.category === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coffre-fort numerique</h1>
          <p className="text-gray-500 mt-1">
            Stockez et organisez vos documents importants en toute securite
          </p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Ajouter
        </Button>
      </div>

      {/* Alertes expiration */}
      {expiringDocs.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 text-base">
              <svg className="w-5 h-5 inline mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Documents a renouveler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringDocs.map(doc => (
                <div key={doc.id} className="flex items-center justify-between">
                  <span className="text-sm text-orange-900">{doc.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-orange-600">Expire le {doc.expiresAt}</span>
                    <Badge variant={validityConfig[doc.validity].variant}>
                      {validityConfig[doc.validity].label}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onglets par categorie */}
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          {categories.map(cat => (
            <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
          ))}
        </TabsList>

        {categories.map(cat => (
          <TabsContent key={cat.value} value={cat.value}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(cat.value === 'all' ? mockDocuments : mockDocuments.filter(d => d.category === cat.value)).map(doc => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => showComingSoonToast()}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <Badge variant={validityConfig[doc.validity].variant}>
                        {validityConfig[doc.validity].label}
                      </Badge>
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm mb-1">{doc.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{doc.type}</span>
                      <span>-</span>
                      <span>{doc.size}</span>
                    </div>
                    {doc.expiresAt && (
                      <p className={`text-xs mt-2 ${validityConfig[doc.validity].color}`}>
                        Expire le {doc.expiresAt}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Modal upload */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Ajouter un document" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de document</label>
            <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option>Piece d'identité</option>
              <option>Acte d'etat civil</option>
              <option>Document vehicule</option>
              <option>Justificatif de domicile</option>
              <option>Document de sante</option>
              <option>Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration (optionnel)</label>
            <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <svg className="w-10 h-10 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600 mb-1">Glissez-deposez ou cliquez pour selectionner</p>
            <p className="text-xs text-gray-400">PDF, JPG, PNG - Max 10 Mo</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowUploadModal(false)}>
              Annuler
            </Button>
            <Button className="flex-1" onClick={() => { setShowUploadModal(false); showComingSoonToast(); }}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
