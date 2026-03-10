// Page Notifications / Preferences

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { showComingSoonToast } from '@/components/ui/coming-soon';

interface NotifPref {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const mockArticles = [
  {
    id: 'a1',
    title: 'Carte d\'identite : les nouveaux delais de renouvellement',
    excerpt: 'A partir du 1er avril 2026, les delais de renouvellement de la carte d\'identite sont modifies...',
    date: '2026-03-03',
    category: 'Actualites',
  },
  {
    id: 'a2',
    title: 'Prime de rentrée scolaire 2026 : les montants',
    excerpt: 'Decouvrez les montants de la prime de rentree scolaire pour l\'annee 2026...',
    date: '2026-02-28',
    category: 'Aides sociales',
  },
  {
    id: 'a3',
    title: 'Elections municipales : pensez a verifier votre inscription',
    excerpt: 'Les elections municipales approchent. Verifiez que vous etes bien inscrit sur les listes electorales.',
    date: '2026-02-20',
    category: 'Infos locales',
  },
  {
    id: 'a4',
    title: 'Nouveau : demandez votre extrait cadastral en ligne',
    excerpt: 'Il est desormais possible de demander un extrait cadastral directement depuis votre espace membre.',
    date: '2026-02-15',
    category: 'Nouveautes',
  },
];

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<NotifPref[]>([
    { id: 'newsletter', label: 'Newsletter Demarches Admin', description: 'Recevez nos conseils et actualites administratives', enabled: true },
    { id: 'aides', label: 'Aides sociales', description: 'Alertes sur les aides auxquelles vous pourriez pretendre', enabled: true },
    { id: 'local', label: 'Infos locales', description: 'Actualites de votre commune et departement', enabled: false },
    { id: 'rappels', label: 'Rappels documents', description: 'Notifications avant expiration de vos documents', enabled: true },
  ]);

  const togglePref = (id: string) => {
    setPrefs(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500 mt-1">
          Gerez vos preferences de communication
        </p>
      </div>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences de notification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {prefs.map(pref => (
              <div key={pref.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{pref.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{pref.description}</p>
                </div>
                <button
                  onClick={() => togglePref(pref.id)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    pref.enabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                      pref.enabled ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <Button onClick={() => showComingSoonToast()}>
              Enregistrer les preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fil d'actualites */}
      <Card>
        <CardHeader>
          <CardTitle>Fil d'actualites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockArticles.map(article => (
              <article
                key={article.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => showComingSoonToast()}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {article.category}
                  </span>
                  <span className="text-xs text-gray-400">{article.date}</span>
                </div>
                <h3 className="font-medium text-gray-900 text-sm mb-1">{article.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{article.excerpt}</p>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
