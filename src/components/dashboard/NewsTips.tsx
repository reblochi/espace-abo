// Composant conseils et actualites pour le dashboard

'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

const tips = [
  {
    title: 'Pensez a renouveler votre CNI',
    description:
      'Votre carte d\'identité doit etre renouvelee tous les 15 ans. Anticipez les delais en faisant votre demande en avance.',
    icon: (
      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
      </svg>
    ),
    color: 'bg-blue-50',
  },
  {
    title: 'Acte de naissance : gratuit pour les abonnes',
    description:
      'En tant qu\'abonne, vos demandes d\'actes d\'etat civil sont incluses dans votre forfait. Profitez-en !',
    icon: (
      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'bg-green-50',
  },
  {
    title: 'Nouveaute : carte grise en ligne',
    description:
      'Vous pouvez desormais faire votre demande de carte grise directement depuis votre espace. Simple et rapide.',
    icon: (
      <svg className="w-8 h-8 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'bg-violet-50',
  },
];

export function NewsTips() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conseils & Actualites</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {tips.map((tip) => (
            <div
              key={tip.title}
              className={`${tip.color} rounded-lg p-4`}
            >
              <div className="mb-3">{tip.icon}</div>
              <h4 className="font-medium text-gray-900 text-sm mb-1">{tip.title}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{tip.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
