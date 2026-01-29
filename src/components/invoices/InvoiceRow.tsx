// Composant Row Facture

'use client';

import { Button, Badge } from '@/components/ui';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Invoice } from '@/types';

interface Props {
  invoice: Invoice;
}

const statusConfig: Record<string, { label: string; variant: 'success' | 'secondary' | 'destructive' }> = {
  PAID: { label: 'Payee', variant: 'success' },
  PENDING: { label: 'En attente', variant: 'secondary' },
  FAILED: { label: 'Echec', variant: 'destructive' },
  REFUNDED: { label: 'Remboursee', variant: 'secondary' },
};

export function InvoiceRow({ invoice }: Props) {
  const status = statusConfig[invoice.status] || { label: invoice.status, variant: 'secondary' as const };

  const handleDownload = () => {
    window.open(`/api/invoices/${invoice.id}/download`, '_blank');
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-900">
          {invoice.number}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-500">
          {formatDate(invoice.createdAt)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(invoice.totalCents)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge variant={status.variant}>
          {status.label}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          PDF
        </Button>
      </td>
    </tr>
  );
}
