// Admin - Fiche client 360

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks';
import Link from 'next/link';

const subscriptionStatusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  ACTIVE: { label: 'Actif', variant: 'success' },
  PENDING: { label: 'En attente', variant: 'warning' },
  PAST_DUE: { label: 'Impaye', variant: 'destructive' },
  CANCELED: { label: 'Annule', variant: 'secondary' },
  ENDED: { label: 'Termine', variant: 'secondary' },
};

const processStatusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  DRAFT: { label: 'Brouillon', variant: 'secondary' },
  PENDING_PAYMENT: { label: 'Attente paiement', variant: 'warning' },
  PAID: { label: 'Paye', variant: 'success' },
  SENT_TO_ADVERCITY: { label: 'Envoye', variant: 'success' },
  IN_PROGRESS: { label: 'En cours', variant: 'warning' },
  COMPLETED: { label: 'Termine', variant: 'success' },
  REFUNDED: { label: 'Rembourse', variant: 'destructive' },
  CANCELED: { label: 'Annule', variant: 'secondary' },
};

const roleLabels: Record<string, string> = {
  USER: 'Client',
  AGENT: 'Agent',
  ADMIN: 'Admin',
};

export default function AdminClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const isCurrentAdmin = currentUser?.role === 'ADMIN';

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) throw new Error('Erreur chargement');
      return res.json();
    },
  });

  const [showAnonymizeConfirm, setShowAnonymizeConfirm] = useState(false);

  const anonymize = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/users/${id}/anonymize`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', id] });
      setShowAnonymizeConfirm(false);
    },
  });

  const changeRole = useMutation({
    mutationFn: async (newRole: string) => {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', id] });
    },
  });

  if (isLoading) {
    return <div className="text-gray-500">Chargement...</div>;
  }

  if (!user) {
    return <div className="text-gray-500">Client non trouve</div>;
  }

  const sub = user.subscription;
  const subStatus = sub ? subscriptionStatusConfig[sub.status] : null;
  const isSelf = currentUser?.id === user.id;

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

      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-semibold text-gray-900">
          {user.firstName} {user.lastName}
        </h1>
        <Badge variant={user.role === 'ADMIN' ? 'destructive' : user.role === 'AGENT' ? 'default' : 'secondary'}>
          {roleLabels[user.role] || user.role}
        </Badge>
      </div>
      <p className="text-sm text-gray-500 mb-6">{user.email}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations personnelles */}
        <Card className="p-4">
          <h2 className="font-medium text-gray-900 mb-3">Informations</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Telephone</dt>
              <dd>{user.phone || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Adresse</dt>
              <dd>{user.address || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Ville</dt>
              <dd>{user.zipCode && user.city ? `${user.zipCode} ${user.city}` : '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Inscription</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
          </dl>

          {/* Gestion du role - admin seulement, pas sur soi-meme */}
          {isCurrentAdmin && !isSelf && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-sm text-gray-600 mb-1">Role</label>
              <select
                value={user.role}
                onChange={(e) => changeRole.mutate(e.target.value)}
                disabled={changeRole.isPending}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
              >
                <option value="USER">Client</option>
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
              </select>
              {changeRole.isPending && <span className="text-xs text-gray-400 ml-2">Sauvegarde...</span>}
              {changeRole.isError && <p className="text-sm text-red-600 mt-1">{(changeRole.error as Error).message}</p>}
            </div>
          )}
        </Card>

        {/* Abonnement */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-gray-900">Abonnement</h2>
            {sub && (
              <Link
                href={`/admin/abonnements/${sub.id}`}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Voir detail
              </Link>
            )}
          </div>
          {sub ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Reference</dt>
                <dd>{sub.reference}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Statut</dt>
                <dd>
                  {subStatus && (
                    <Badge variant={subStatus.variant}>{subStatus.label}</Badge>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Montant</dt>
                <dd>{formatCurrency(sub.amountCents)}/mois</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Carte</dt>
                <dd>
                  {sub.cardLast4
                    ? `${sub.cardBrand || ''} •••• ${sub.cardLast4} (exp. ${sub.cardExpMonth}/${sub.cardExpYear})`
                    : '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Periode en cours</dt>
                <dd>{formatDate(sub.currentPeriodStart)} - {formatDate(sub.currentPeriodEnd)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Echeances payees</dt>
                <dd>{sub.deadlines?.filter((d: { paymentStatus: string }) => d.paymentStatus === 'PAID').length || 0}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-gray-400">Aucun abonnement</p>
          )}
        </Card>

        {/* Factures */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-gray-900">Factures ({user.invoices?.length || 0})</h2>
          </div>
          {user.invoices?.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {user.invoices.map((inv: { id: string; number: string; type: string; totalCents: number; status: string; createdAt: string }) => (
                <Link
                  key={inv.id}
                  href={`/admin/factures/${inv.id}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50 text-sm"
                >
                  <div>
                    <span className="font-medium">{inv.number}</span>
                    <span className="text-gray-400 ml-2 text-xs">{inv.type === 'CREDIT_NOTE' ? 'Avoir' : inv.type === 'SUBSCRIPTION' ? 'Abo' : 'Demarche'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={inv.totalCents < 0 ? 'text-red-600' : ''}>{formatCurrency(inv.totalCents)}</span>
                    <span className="text-xs text-gray-400">{formatDate(inv.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucune facture</p>
          )}
        </Card>

        {/* Demarches */}
        <Card className="p-4">
          <h2 className="font-medium text-gray-900 mb-3">Demarches ({user.processes?.length || 0})</h2>
          {user.processes?.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {user.processes.map((proc: { id: string; reference: string; type: string; status: string; amountCents: number; isFromSubscription: boolean; createdAt: string }) => {
                const statusConf = processStatusConfig[proc.status] || { label: proc.status, variant: 'secondary' as const };
                return (
                  <div key={proc.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 text-sm">
                    <div>
                      <span className="font-medium">{proc.reference}</span>
                      {proc.isFromSubscription && (
                        <span className="text-xs text-blue-500 ml-1">(abo)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
                      <span className="text-xs text-gray-400">{formatDate(proc.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucune demarche</p>
          )}
        </Card>

        {/* Litiges */}
        {user.disputes?.length > 0 && (
          <Card className="p-4 lg:col-span-2">
            <h2 className="font-medium text-gray-900 mb-3">Litiges ({user.disputes.length})</h2>
            <div className="space-y-2">
              {user.disputes.map((d: { id: string; pspDisputeId: string; amountCents: number; reason: string; status: string; disputedAt: string }) => (
                <Link
                  key={d.id}
                  href={`/admin/litiges/${d.id}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-50 text-sm"
                >
                  <div>
                    <span className="font-medium">{d.pspDisputeId}</span>
                    <span className="text-gray-400 ml-2 text-xs">{d.reason || 'Non specifie'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">{formatCurrency(d.amountCents)}</span>
                    <Badge variant={d.status === 'LOST' ? 'destructive' : d.status === 'WON' ? 'success' : 'warning'}>
                      {d.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* RGPD - Anonymisation */}
        {!isSelf && user.role === 'USER' && (
          <Card className="p-4 lg:col-span-2 border-orange-200">
            <h2 className="font-medium text-gray-900 mb-2">RGPD</h2>
            <p className="text-sm text-gray-500 mb-3">
              Anonymiser les donnees de traitement (formulaires, documents). Les informations
              d&apos;identification et les factures sont conservees (obligation legale 10 ans).
            </p>
            {anonymize.isSuccess && (
              <p className="text-sm text-green-600 mb-3">Donnees de traitement anonymisees.</p>
            )}
            {anonymize.isError && (
              <p className="text-sm text-red-600 mb-3">{(anonymize.error as Error).message}</p>
            )}
            {!showAnonymizeConfirm ? (
              <button
                onClick={() => setShowAnonymizeConfirm(true)}
                className="text-sm text-orange-600 hover:text-orange-800"
              >
                Anonymiser les donnees de traitement
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => anonymize.mutate()}
                  disabled={anonymize.isPending}
                  className="text-sm bg-orange-600 text-white px-3 py-1.5 rounded hover:bg-orange-700 disabled:opacity-50"
                >
                  {anonymize.isPending ? 'Anonymisation...' : 'Confirmer'}
                </button>
                <button
                  onClick={() => setShowAnonymizeConfirm(false)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
