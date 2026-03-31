// Admin - Detail facture

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function AdminInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreditNoteForm, setShowCreditNoteForm] = useState(false);
  const [creditNoteReason, setCreditNoteReason] = useState('');
  const [creditNoteAmount, setCreditNoteAmount] = useState('');

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['admin', 'invoice', id],
    queryFn: async () => {
      const res = await fetch(`/api/gestion/invoices/${id}`);
      if (!res.ok) throw new Error('Erreur chargement');
      return res.json();
    },
  });

  const createCreditNote = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        invoiceId: id,
        reason: creditNoteReason,
      };
      if (creditNoteAmount) {
        body.amountCents = Math.round(parseFloat(creditNoteAmount) * 100);
      }
      const res = await fetch('/api/gestion/invoices/credit-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invoice', id] });
      setShowCreditNoteForm(false);
      router.push(`/gestion/factures/${data.id}`);
    },
  });

  if (isLoading) return <div className="text-gray-500">Chargement...</div>;
  if (!invoice) return <div className="text-gray-500">Facture non trouvée</div>;

  const isCreditNote = invoice.type === 'CREDIT_NOTE';

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="text-sm text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{invoice.number}</h1>
        <Badge variant={isCreditNote ? 'destructive' : invoice.status === 'PAID' ? 'success' : 'secondary'}>
          {isCreditNote ? 'Avoir' : invoice.status === 'PAID' ? 'Payée' : invoice.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="font-medium text-gray-900 mb-3">Details</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Type</dt>
              <dd>{isCreditNote ? 'Avoir' : invoice.type === 'SUBSCRIPTION' ? 'Abonnement' : 'Demarche'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">HT</dt>
              <dd>{formatCurrency(invoice.subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">TVA ({invoice.taxRate}%)</dt>
              <dd>{formatCurrency(invoice.taxCents)}</dd>
            </div>
            <div className="flex justify-between font-medium">
              <dt>TTC</dt>
              <dd className={invoice.totalCents < 0 ? 'text-red-600' : ''}>{formatCurrency(invoice.totalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Date</dt>
              <dd>{formatDate(invoice.createdAt)}</dd>
            </div>
            {invoice.paidAt && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Payé le</dt>
                <dd>{formatDate(invoice.paidAt)}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card className="p-4">
          <h2 className="font-medium text-gray-900 mb-3">Liens</h2>
          <dl className="space-y-2 text-sm">
            {invoice.user && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Client</dt>
                <dd>
                  <Link href={`/gestion/clients/${invoice.user.id}`} className="text-blue-600 hover:text-blue-800">
                    {invoice.user.firstName} {invoice.user.lastName}
                  </Link>
                </dd>
              </div>
            )}
            {invoice.process && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Demarche</dt>
                <dd>{invoice.process.reference}</dd>
              </div>
            )}
            {invoice.deadline && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Échéance</dt>
                <dd>
                  <Link
                    href={`/gestion/abonnements/${invoice.deadline.subscriptionId}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Échéance #{invoice.deadline.deadlineNumber}
                  </Link>
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-4 flex gap-2">
            <a
              href={`/api/gestion/invoices/${id}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Telecharger PDF
            </a>
          </div>
        </Card>

        {/* Creation avoir */}
        {!isCreditNote && invoice.status === 'PAID' && (
          <Card className="p-4 lg:col-span-2">
            {!showCreditNoteForm ? (
              <Button
                variant="outline"
                onClick={() => setShowCreditNoteForm(true)}
              >
                Creer un avoir
              </Button>
            ) : (
              <div>
                <h2 className="font-medium text-gray-900 mb-3">Créer un avoir</h2>
                <div className="space-y-3 max-w-md">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Motif</label>
                    <input
                      type="text"
                      value={creditNoteReason}
                      onChange={(e) => setCreditNoteReason(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder="Motif de l'avoir"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Montant (EUR) - laisser vide pour remboursement total ({formatCurrency(invoice.totalCents)})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={creditNoteAmount}
                      onChange={(e) => setCreditNoteAmount(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      placeholder={`Max: ${(invoice.totalCents / 100).toFixed(2)}`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => createCreditNote.mutate()}
                      disabled={!creditNoteReason || createCreditNote.isPending}
                    >
                      {createCreditNote.isPending ? 'Creation...' : 'Confirmer'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreditNoteForm(false)}>
                      Annuler
                    </Button>
                  </div>
                  {createCreditNote.isError && (
                    <p className="text-sm text-red-600">{(createCreditNote.error as Error).message}</p>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
