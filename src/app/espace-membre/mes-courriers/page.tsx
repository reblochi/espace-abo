// Page Mes Courriers

'use client';

import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { showComingSoonToast } from '@/components/ui/coming-soon';
import { Progress } from '@/components/ui/progress';

const templates = [
  {
    id: '1',
    title: 'Reclamation FAI',
    description: 'Contester une facture ou signaler un dysfonctionnement',
    icon: '📡',
    category: 'Telecom',
  },
  {
    id: '2',
    title: 'Contestation PV',
    description: 'Contester une amende de stationnement ou de circulation',
    icon: '🚗',
    category: 'Vehicule',
  },
  {
    id: '3',
    title: 'Resiliation contrat',
    description: 'Resilier un abonnement, assurance ou contrat',
    icon: '✂️',
    category: 'General',
  },
  {
    id: '4',
    title: 'Lettre de mise en demeure',
    description: 'Mise en demeure avant action juridique',
    icon: '⚖️',
    category: 'Juridique',
  },
  {
    id: '5',
    title: 'Demande de remboursement',
    description: 'Demander le remboursement d\'un produit ou service',
    icon: '💰',
    category: 'General',
  },
  {
    id: '6',
    title: 'Courrier au proprietaire',
    description: 'Signalement, demande de travaux, conge',
    icon: '🏠',
    category: 'Logement',
  },
];

const mockHistory = [
  { id: 'c1', title: 'Resiliation SFR', date: '2026-02-15', status: 'sent' },
  { id: 'c2', title: 'Contestation PV Paris', date: '2026-01-20', status: 'sent' },
];

export default function MesCourriersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes courriers</h1>
        <p className="text-gray-500 mt-1">
          Generez des courriers types personnalises en quelques clics
        </p>
      </div>

      {/* Compteur de courriers */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Courriers restants ce mois</span>
            <span className="text-sm font-semibold text-gray-900">3/5</span>
          </div>
          <Progress value={2} max={5} color="blue" size="md" />
          <p className="text-xs text-gray-500 mt-1">
            Vous pouvez generer 3 courriers supplementaires ce mois-ci
          </p>
        </CardContent>
      </Card>

      {/* Modeles disponibles */}
      <Card>
        <CardHeader>
          <CardTitle>Modeles disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => showComingSoonToast()}
                className="text-left p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{template.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                    <Badge variant="secondary" className="mt-2">{template.category}</Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historique */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des courriers</CardTitle>
        </CardHeader>
        <CardContent>
          {mockHistory.length > 0 ? (
            <div className="space-y-3">
              {mockHistory.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success">Envoye</Badge>
                    <Button variant="ghost" size="sm" onClick={() => showComingSoonToast()}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500">Aucun courrier envoye</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
