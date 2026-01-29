// Composant Badge de statut demarche

'use client';

import { Badge } from '@/components/ui';
import type { ProcessStatus } from '@/types';

interface Props {
  status: ProcessStatus;
}

const statusConfig: Record<ProcessStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  PENDING_PAYMENT: { label: 'En attente paiement', variant: 'warning' },
  PAID: { label: 'Payee', variant: 'default' },
  SENT_TO_ADVERCITY: { label: 'Envoyee', variant: 'default' },
  IN_PROGRESS: { label: 'En cours', variant: 'default' },
  COMPLETED: { label: 'Terminee', variant: 'success' },
  REFUNDED: { label: 'Remboursee', variant: 'secondary' },
  CANCELED: { label: 'Annulee', variant: 'destructive' },
};

export function ProcessStatusBadge({ status }: Props) {
  const config = statusConfig[status] || { label: status, variant: 'secondary' as const };

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
