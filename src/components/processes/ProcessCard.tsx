// Composant Card demarche

'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { ProcessStatusBadge } from './ProcessStatusBadge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { getProcessTypeConfig } from '@/lib/process-types';
import type { Process, ProcessType } from '@/types';

interface Props {
  process: Process;
}

export function ProcessCard({ process }: Props) {
  const processConfig = getProcessTypeConfig(process.type as ProcessType);
  const processData = process.data as Record<string, unknown> | null;
  const isVehicleProcess = process.type === 'REGISTRATION_CERT';

  // Extraire les informations specifiques selon le type
  let subtitle = '';
  if (isVehicleProcess && processData?.vehicle) {
    const vehicle = processData.vehicle as Record<string, unknown>;
    subtitle = vehicle.registrationNumber as string || '';
  } else if (process.type.startsWith('CIVIL_STATUS_') && processData) {
    const beneficiary = processData.beneficiaryFirstName && processData.beneficiaryLastName
      ? `${processData.beneficiaryFirstName} ${processData.beneficiaryLastName}`
      : '';
    subtitle = beneficiary;
  }

  return (
    <Link href={`/espace-membre/mes-demarches/${process.reference}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base truncate">
                {processConfig?.label || process.type}
              </CardTitle>
              {subtitle && (
                <p className="text-sm text-gray-500 font-mono truncate mt-1">{subtitle}</p>
              )}
            </div>
            <ProcessStatusBadge status={process.status} isFree={process.amountCents === 0} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Référence</span>
              <span className="font-medium text-gray-900 font-mono text-xs">{process.reference}</span>
            </div>
            <div className="flex justify-between">
              <span>Date</span>
              <span>{formatDate(process.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Montant</span>
              <span className={process.amountCents === 0 ? 'text-green-600 font-medium' : process.isFromSubscription ? 'text-green-600 font-medium' : ''}>
                {process.amountCents === 0 ? 'Gratuit' : process.isFromSubscription ? 'Inclus' : formatCurrency(process.amountCents)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
