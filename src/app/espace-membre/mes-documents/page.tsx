// Page Mes Documents

'use client';

import { useState } from 'react';
import { DocumentList } from '@/components/documents';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { showComingSoonToast } from '@/components/ui/coming-soon';

const documentCategories = [
  { value: 'all', label: 'Tous' },
  { value: 'officiels', label: 'Officiels' },
  { value: 'personnels', label: 'Personnels' },
  { value: 'demarches', label: 'Demarches' },
];

// Exemples de documents avec validite (fictifs pour la section rappels)
const expiringDocs = [
  { name: 'Carte d\'identité', expiresAt: '2026-06-15', status: 'warning' as const },
  { name: 'Passeport', expiresAt: '2027-03-22', status: 'valid' as const },
  { name: 'Permis de conduire', expiresAt: '2025-12-01', status: 'expired' as const },
];

const validityBadge = {
  valid: { label: 'Valide', variant: 'success' as const },
  warning: { label: 'Expire bientot', variant: 'warning' as const },
  expired: { label: 'Expire', variant: 'destructive' as const },
};

export default function MesDocumentsPage() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes documents</h1>
          <p className="text-gray-500 mt-1">
            Retrouvez tous les documents generes lors de vos demarches
          </p>
        </div>
        <Button onClick={() => showComingSoonToast()}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Ajouter un document
        </Button>
      </div>

      {/* Rappels d'expiration */}
      <Card>
        <CardHeader>
          <CardTitle>Validite de vos documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expiringDocs.map((doc) => {
              const badge = validityBadge[doc.status];
              return (
                <div key={doc.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">Expire le {doc.expiresAt}</p>
                    </div>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Onglets par categorie */}
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          {documentCategories.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <DocumentList />
        </TabsContent>
        <TabsContent value="officiels">
          <DocumentList />
        </TabsContent>
        <TabsContent value="personnels">
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 mb-4">Aucun document personnel</p>
            <Button variant="outline" onClick={() => showComingSoonToast()}>
              Ajouter un document
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="demarches">
          <DocumentList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
