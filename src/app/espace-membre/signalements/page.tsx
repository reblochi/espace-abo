// Page Signalements

'use client';

import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Textarea } from '@/components/ui';
import { showComingSoonToast } from '@/components/ui/coming-soon';

const categories = [
  'Voirie et trottoirs',
  'Eclairage public',
  'Proprete et dechets',
  'Espaces verts',
  'Stationnement',
  'Bruit et nuisances',
  'Securite',
  'Autre',
];

const mockSignalements = [
  {
    id: 's1',
    category: 'Eclairage public',
    description: 'Lampadaire en panne devant le 12 rue de la Mairie',
    date: '2026-02-28',
    status: 'en_cours',
  },
  {
    id: 's2',
    category: 'Voirie et trottoirs',
    description: 'Nid-de-poule dangereux angle rue des Lilas / avenue Gambetta',
    date: '2026-02-15',
    status: 'traite',
  },
  {
    id: 's3',
    category: 'Proprete et dechets',
    description: 'Depot sauvage de dechets pres du parking du stade',
    date: '2026-01-20',
    status: 'traite',
  },
];

const statusConfig = {
  en_cours: { label: 'En cours', variant: 'warning' as const },
  traite: { label: 'Traite', variant: 'success' as const },
  nouveau: { label: 'Nouveau', variant: 'default' as const },
};

export default function SignalementsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Signalements</h1>
        <p className="text-gray-500 mt-1">
          Signalez un probleme dans votre commune
        </p>
      </div>

      {/* Formulaire de signalement */}
      <Card>
        <CardHeader>
          <CardTitle>Nouveau signalement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); showComingSoonToast(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
              <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Selectionnez une categorie</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <Textarea
                placeholder="Decrivez le probleme de maniere precise..."
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo (optionnel)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm text-gray-500">Cliquez pour ajouter une photo</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG - Max 10 Mo</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
              <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center border border-gray-200">
                <div className="text-center">
                  <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm text-gray-500">Carte interactive</p>
                  <p className="text-xs text-gray-400">Cliquez pour placer un marqueur</p>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Envoyer le signalement
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Historique */}
      <Card>
        <CardHeader>
          <CardTitle>Mes signalements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockSignalements.map(sig => {
              const status = statusConfig[sig.status as keyof typeof statusConfig];
              return (
                <div key={sig.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">{sig.category}</Badge>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="text-sm text-gray-700">{sig.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{sig.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
