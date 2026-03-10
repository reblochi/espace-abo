// Composant QuotaGauge - Jauge de quota demarches mensuel

'use client';

import { Progress } from '@/components/ui/progress';

interface QuotaGaugeProps {
  used: number;
  max: number;
  className?: string;
}

export function QuotaGauge({ used, max, className }: QuotaGaugeProps) {
  const percentage = Math.round((used / max) * 100);
  const color = percentage >= 90 ? 'red' : percentage >= 70 ? 'yellow' : 'green';

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">Demarches ce mois</span>
        </div>
        <span className="text-sm font-semibold text-gray-900">
          {used} / {max}
        </span>
      </div>
      <Progress value={used} max={max} color={color} size="md" />
      {percentage >= 90 && (
        <p className="text-xs text-red-600 mt-1">
          Vous approchez de la limite mensuelle
        </p>
      )}
    </div>
  );
}
