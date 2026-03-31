// Admin - Detail abonnement avec actions

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const paymentStatusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  PENDING: { label: 'En attente', variant: 'warning' },
  PAID: { label: 'Paye', variant: 'success' },
  FAILED: { label: 'Echoue', variant: 'destructive' },
  REFUNDED: { label: 'Rembourse', variant: 'destructive' },
};

const subscriptionStatusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  ACTIVE: { label: 'Actif', variant: 'success' },
  PENDING: { label: 'En attente', variant: 'warning' },
  PAST_DUE: { label: 'Impaye', variant: 'destructive' },
  CANCELED: { label: 'Annule', variant: 'secondary' },
  ENDED: { label: 'Termine', variant: 'secondary' },
};

interface Deadline {
  id: string;
  deadlineNumber: number;
  amountCents: number;
  dueDate: string;
  status: string;
  paymentStatus: string;
  paidAt: string | null;
  refundedAt: string | null;
  refundedAmount: number | null;
  invoice: { id: string; number: string } | null;
}

export default function AdminSubscriptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedDeadlines, setSelectedDeadlines] = useState<string[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelImmediate, setCancelImmediate] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const { data: sub, isLoading } = useQuery({
    queryKey: ['admin', 'subscription', id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/subscriptions/${id}`);
      if (!res.ok) throw new Error('Erreur chargement');
      return res.json();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/subscriptions/${id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason, immediate: cancelImmediate }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscription', id] });
      setShowCancelConfirm(false);
    },
  });

  const refundMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/subscriptions/${id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadlineIds: selectedDeadlines, reason: refundReason }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscription', id] });
      setSelectedDeadlines([]);
      setRefundReason('');
    },
  });

  if (isLoading) return <div className="text-gray-500">Chargement...</div>;
  if (!sub) return <div className="text-gray-500">Abonnement non trouve</div>;

  const statusConf = subscriptionStatusConfig[sub.status] || { label: sub.status, variant: 'secondary' as const };
  const isActive = ['ACTIVE', 'PAST_DUE', 'PENDING'].includes(sub.status);
  const refundableDeadlines = (sub.deadlines as Deadline[]).filter((d) => d.paymentStatus === 'PAID');

  const toggleDeadline = (deadlineId: string) => {
    setSelectedDeadlines((prev) =>
      prev.includes(deadlineId) ? prev.filter((id) => id !== deadlineId) : [...prev, deadlineId]
    );
  };

  return (
    <div>
      <button onClick={() => router.back()} className="text-sm text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{sub.reference}</h1>
        <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Infos abonnement */}
        <Card className="p-4">
          <h2 className="font-medium text-gray-900 mb-3">Abonnement</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Utilisateur</dt>
              <dd>
                <Link href={`/admin/clients/${sub.user.id}`} className="text-blue-600 hover:text-blue-800">
                  {sub.user.firstName} {sub.user.lastName}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd>{sub.user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Montant</dt>
              <dd>{formatCurrency(sub.amountCents)}/mois</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">PSP</dt>
              <dd>{sub.pspProvider}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Debut</dt>
              <dd>{formatDate(sub.startDate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Periode en cours</dt>
              <dd>{formatDate(sub.currentPeriodStart)} - {formatDate(sub.currentPeriodEnd)}</dd>
            </div>
            {sub.canceledAt && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Annule le</dt>
                <dd>{formatDate(sub.canceledAt)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">Carte</dt>
              <dd>
                {sub.cardLast4
                  ? `${sub.cardBrand || ''} •••• ${sub.cardLast4} (exp. ${sub.cardExpMonth}/${sub.cardExpYear})`
                  : '-'}
              </dd>
            </div>
          </dl>

          {isActive && (
            <div className="mt-4">
              {!showCancelConfirm ? (
                <Button variant="outline" onClick={() => setShowCancelConfirm(true)}>
                  Desabonner
                </Button>
              ) : (
                <div className="space-y-3 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-800">Confirmer la desabonnement</p>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Motif (optionnel)"
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={cancelImmediate}
                      onChange={(e) => setCancelImmediate(e.target.checked)}
                    />
                    Annulation immediate (sinon fin de periode)
                  </label>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {cancelMutation.isPending ? 'Annulation...' : 'Confirmer'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
                      Annuler
                    </Button>
                  </div>
                  {cancelMutation.isError && (
                    <p className="text-sm text-red-600">{(cancelMutation.error as Error).message}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Actions remboursement */}
        {selectedDeadlines.length > 0 && (
          <Card className="p-4">
            <h2 className="font-medium text-gray-900 mb-3">
              Rembourser {selectedDeadlines.length} echeance{selectedDeadlines.length > 1 ? 's' : ''}
            </h2>
            <input
              type="text"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Motif du remboursement"
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm mb-3"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => refundMutation.mutate()}
                disabled={refundMutation.isPending}
              >
                {refundMutation.isPending ? 'Remboursement...' : 'Rembourser'}
              </Button>
              <Button variant="outline" onClick={() => setSelectedDeadlines([])}>
                Annuler
              </Button>
            </div>
            {refundMutation.isError && (
              <p className="text-sm text-red-600 mt-2">{(refundMutation.error as Error).message}</p>
            )}
          </Card>
        )}
      </div>

      {/* Tableau des echeances */}
      <Card className="p-4">
        <h2 className="font-medium text-gray-900 mb-3">Echeances ({sub.deadlines?.length || 0})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-3 py-2 text-left w-8"></th>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Montant</th>
                <th className="px-3 py-2 text-left">Echeance</th>
                <th className="px-3 py-2 text-left">Statut</th>
                <th className="px-3 py-2 text-left">Paye le</th>
                <th className="px-3 py-2 text-left">Facture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(sub.deadlines as Deadline[]).map((d) => {
                const pConf = paymentStatusConfig[d.paymentStatus] || { label: d.paymentStatus, variant: 'secondary' as const };
                const canRefund = d.paymentStatus === 'PAID';
                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      {canRefund && (
                        <input
                          type="checkbox"
                          checked={selectedDeadlines.includes(d.id)}
                          onChange={() => toggleDeadline(d.id)}
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium">{d.deadlineNumber}</td>
                    <td className="px-3 py-2">{formatCurrency(d.amountCents)}</td>
                    <td className="px-3 py-2">{formatDate(d.dueDate)}</td>
                    <td className="px-3 py-2">
                      <Badge variant={pConf.variant}>{pConf.label}</Badge>
                      {d.refundedAt && (
                        <span className="text-xs text-gray-400 ml-1">
                          ({formatDate(d.refundedAt)})
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">{d.paidAt ? formatDate(d.paidAt) : '-'}</td>
                    <td className="px-3 py-2">
                      {d.invoice ? (
                        <Link href={`/admin/factures/${d.invoice.id}`} className="text-blue-600 hover:text-blue-800 text-xs">
                          {d.invoice.number}
                        </Link>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
