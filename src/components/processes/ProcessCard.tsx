// Composant Card demarche

'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { ProcessStatusBadge } from './ProcessStatusBadge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { processTypeLabels } from '@/types';
import type { Process } from '@/types';

interface Props {
  process: Process;
}

export function ProcessCard({ process }: Props) {
  return (
    <Link href={`/espace-membre/mes-demarches/${process.reference}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-base">
              {processTypeLabels[process.type] || process.type}
            </CardTitle>
            <ProcessStatusBadge status={process.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Reference</span>
              <span className="font-medium text-gray-900">{process.reference}</span>
            </div>
            <div className="flex justify-between">
              <span>Date</span>
              <span>{formatDate(process.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Montant</span>
              <span className={process.isFromSubscription ? 'text-green-600' : ''}>
                {process.isFromSubscription ? 'Inclus' : formatCurrency(process.amountCents)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
