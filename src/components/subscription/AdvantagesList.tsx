// Composant liste des avantages de l'abonnement

'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

const advantages = [
  { label: 'Demarches d\'etat civil illimitees', included: true },
  { label: 'Suivi en temps reel de vos procedures', included: true },
  { label: 'Assistance prioritaire par email', included: true },
  { label: 'Coffre-fort numerique securise', included: true },
  { label: 'Rappels d\'expiration de documents', included: true },
  { label: 'Courriers types personnalises (3/mois)', included: true },
  { label: 'Historique et archivage de toutes vos demarches', included: true },
  { label: 'Aucun engagement - resiliation a tout moment', included: true },
];

export function AdvantagesList({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Vos avantages inclus</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {advantages.map((adv) => (
            <li key={adv.label} className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm text-gray-700">{adv.label}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
