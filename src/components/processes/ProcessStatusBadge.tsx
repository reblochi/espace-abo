// Composant Badge de statut demarche

'use client';

import { Badge } from '@/components/ui';
interface Props {
  status: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' }> = {
  DRAFT: { label: 'Brouillon', variant: 'secondary' },
  PENDING_DOCUMENTS: { label: 'Documents requis', variant: 'warning' },
  PENDING_PAYMENT: { label: 'En attente paiement', variant: 'warning' },
  PAYMENT_PROCESSING: { label: 'Paiement en cours', variant: 'info' },
  PAYMENT_FAILED: { label: 'Paiement echoue', variant: 'destructive' },
  PAID: { label: 'Payee', variant: 'info' },
  SENT_TO_ADVERCITY: { label: 'En traitement', variant: 'info' },
  IN_PROGRESS: { label: 'En cours', variant: 'default' },
  AWAITING_INFO: { label: 'Info requise', variant: 'warning' },
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
