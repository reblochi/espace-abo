// Admin - Detail litige

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  NEEDS_RESPONSE: { label: 'A traiter', variant: 'destructive' },
  UNDER_REVIEW: { label: 'En cours', variant: 'warning' },
  WON: { label: 'Gagne', variant: 'success' },
  LOST: { label: 'Perdu', variant: 'secondary' },
};

export default function AdminDisputeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [notesLoaded, setNotesLoaded] = useState(false);

  const { data: dispute, isLoading } = useQuery({
    queryKey: ['admin', 'dispute', id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/disputes/${id}`);
      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      if (!notesLoaded) {
        setNotes(data.adminNotes || '');
        setNotesLoaded(true);
      }
      return data;
    },
  });

  const saveNotes = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/disputes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: notes }),
      });
      if (!res.ok) throw new Error('Erreur sauvegarde');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dispute', id] });
    },
  });

  if (isLoading) return <div className="text-gray-500">Chargement...</div>;
  if (!dispute) return <div className="text-gray-500">Litige non trouve</div>;

  const conf = statusConfig[dispute.status] || { label: dispute.status, variant: 'secondary' as const };

  return (
    <div>
      <button onClick={() => router.back()} className="text-sm text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </button>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Litige {dispute.pspDisputeId}</h1>
        <Badge variant={conf.variant}>{conf.label}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h2 className="font-medium text-gray-900 mb-3">Informations</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">PSP</dt>
              <dd>{dispute.pspProvider}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">ID Payment</dt>
              <dd className="font-mono text-xs">{dispute.pspPaymentId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Montant</dt>
              <dd className="text-red-600 font-medium">{formatCurrency(dispute.amountCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Raison</dt>
              <dd>{dispute.reason || 'Non specifie'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Date du litige</dt>
              <dd>{formatDate(dispute.disputedAt)}</dd>
            </div>
            {dispute.resolvedAt && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Resolu le</dt>
                <dd>{formatDate(dispute.resolvedAt)}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card className="p-4">
          <h2 className="font-medium text-gray-900 mb-3">Liens</h2>
          <dl className="space-y-2 text-sm">
            {dispute.subscriptionId && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Abonnement</dt>
                <dd>
                  <Link href={`/admin/abonnements/${dispute.subscriptionId}`} className="text-blue-600 hover:text-blue-800">
                    Voir
                  </Link>
                </dd>
              </div>
            )}
            {dispute.creditNote && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Avoir</dt>
                <dd>
                  <Link href={`/admin/factures/${dispute.creditNote.id}`} className="text-blue-600 hover:text-blue-800">
                    {dispute.creditNote.number} ({formatCurrency(dispute.creditNote.totalCents)})
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <Card className="p-4 lg:col-span-2">
          <h2 className="font-medium text-gray-900 mb-3">Notes admin</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
            placeholder="Ajouter des notes sur ce litige..."
          />
          <Button
            onClick={() => saveNotes.mutate()}
            disabled={saveNotes.isPending}
          >
            {saveNotes.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
          {saveNotes.isSuccess && (
            <span className="text-sm text-green-600 ml-2">Sauvegarde</span>
          )}
        </Card>
      </div>
    </div>
  );
}
