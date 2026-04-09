// Admin - Detail contact + reponse

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useContactDetail, useAdminReplyContact, useUpdateContactStatus } from '@/hooks/useMessages';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'info' }> = {
  NEW: { label: 'Nouveau', variant: 'info' },
  IN_PROGRESS: { label: 'En cours', variant: 'warning' },
  WAITING_CUSTOMER: { label: 'Attente client', variant: 'secondary' },
  RESOLVED: { label: 'Résolu', variant: 'success' },
  CLOSED: { label: 'Fermé', variant: 'secondary' },
};

const subjectLabels: Record<string, string> = {
  DEMARCHE: 'Démarche',
  ABONNEMENT: 'Abonnement',
  TECHNIQUE: 'Technique',
  SIGNALEMENT: 'Signalement',
  RETRACTATION: 'Rétractation',
  DONNEES: 'Données',
  AUTRE: 'Autre',
};

export default function AdminContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: contact, isLoading, error } = useContactDetail(id);
  const replyMutation = useAdminReplyContact();
  const statusMutation = useUpdateContactStatus();
  const [replyText, setReplyText] = useState('');

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await replyMutation.mutateAsync({ contactId: id, message: replyText.trim() });
    setReplyText('');
  };

  const handleStatusChange = async (newStatus: string) => {
    await statusMutation.mutateAsync({ contactId: id, status: newStatus });
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Chargement...</div>;
  }

  if (error || !contact) {
    return <div className="text-center py-12 text-red-500">Contact non trouvé</div>;
  }

  const conf = statusConfig[contact.status] || { label: contact.status, variant: 'secondary' as const };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/gestion/contacts')} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-gray-900">{contact.reference}</h1>
          <p className="text-sm text-gray-500">
            {subjectLabels[contact.subject] || contact.subject} - {contact.firstName} {contact.lastName}
          </p>
        </div>
        <Badge variant={conf.variant}>{conf.label}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Thread principal */}
        <div className="lg:col-span-2 space-y-4">
          {/* Message initial */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-medium text-gray-900">{contact.firstName} {contact.lastName}</span>
                <span className="text-gray-400 text-xs ml-2">{contact.email}</span>
              </div>
              <span className="text-xs text-gray-400">{formatDate(contact.createdAt)}</span>
            </div>
            {contact.processReference && (
              <p className="text-xs text-blue-600 mb-2">Réf. démarche : {contact.processReference}</p>
            )}
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.message}</p>

            {/* Fichiers */}
            {contact.files?.length > 0 && (
              <div className="mt-3 pt-3 border-t space-y-1">
                <p className="text-xs font-medium text-gray-500 mb-1">Pièces jointes :</p>
                {contact.files.map((f: { id: string; fileName: string; fileSize: number; downloadUrl?: string | null }) => (
                  <div key={f.id} className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {f.downloadUrl ? (
                      <a href={f.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {f.fileName}
                      </a>
                    ) : (
                      <span className="text-gray-700">{f.fileName}</span>
                    )}
                    <span className="text-xs text-gray-400">{(f.fileSize / 1024).toFixed(0)} Ko</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Replies */}
          {contact.replies?.map((reply: { id: string; sender: string; senderName: string | null; message: string; sentAt: string }) => (
            <div
              key={reply.id}
              className={`rounded-lg shadow-sm border p-4 ${
                reply.sender === 'admin' ? 'bg-blue-50 border-blue-200' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium text-sm ${reply.sender === 'admin' ? 'text-blue-800' : 'text-gray-900'}`}>
                  {reply.sender === 'admin' ? (reply.senderName || 'Support') : `${contact.firstName} ${contact.lastName}`}
                </span>
                <span className="text-xs text-gray-400">{formatDate(reply.sentAt)}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</p>
            </div>
          ))}

          {/* Zone reponse admin */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Répondre</h3>
            {replyMutation.error && (
              <p className="text-red-500 text-xs mb-2">{replyMutation.error.message}</p>
            )}
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Votre réponse..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
            />
            <button
              onClick={handleReply}
              disabled={!replyText.trim() || replyMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {replyMutation.isPending ? 'Envoi...' : 'Envoyer la réponse'}
            </button>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          {/* Infos */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Informations</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Référence</dt>
                <dd className="font-mono">{contact.reference}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Email</dt>
                <dd>{contact.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Sujet</dt>
                <dd>{subjectLabels[contact.subject] || contact.subject}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Date</dt>
                <dd>{formatDate(contact.createdAt)}</dd>
              </div>
              {contact.processReference && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Réf. démarche</dt>
                  <dd className="text-blue-600">{contact.processReference}</dd>
                </div>
              )}
              {contact.ipAddress && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">IP</dt>
                  <dd className="font-mono text-xs">{contact.ipAddress}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Actions statut */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Changer le statut</h3>
            <div className="space-y-2">
              {['IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'].map((s) => {
                const c = statusConfig[s];
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={contact.status === s || statusMutation.isPending}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      contact.status === s
                        ? 'bg-gray-100 text-gray-400 cursor-default'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {c?.label || s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
