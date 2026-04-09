// Hook pour la messagerie (conversations demarches + contacts)

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface MessageItem {
  id: string;
  sender: 'user' | 'support' | 'system';
  senderName?: string;
  content: string;
  date: string;
  attachments?: { id: number; file_name: string }[];
}

export interface Conversation {
  id: string;
  type: 'process' | 'contact';
  subject: string;
  status: 'open' | 'closed';
  lastMessage: string;
  date: string;
  unread: boolean;
  messages: MessageItem[];
}

export function useMessages() {
  return useQuery<{ conversations: Conversation[] }>({
    queryKey: ['messages'],
    queryFn: async () => {
      const res = await fetch('/api/messages');
      if (!res.ok) throw new Error('Erreur chargement messages');
      return res.json();
    },
    refetchInterval: 30000, // Poll toutes les 30s
  });
}

export function useReplyToMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { type: 'process' | 'contact'; id: string; message: string; files?: File[] }) => {
      const formData = new FormData();
      formData.set('type', data.type);
      formData.set('id', data.id);
      formData.set('message', data.message);
      if (data.files) {
        for (const file of data.files) {
          formData.append('files', file);
        }
      }

      const res = await fetch('/api/messages/reply', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur envoi message');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

// Hook admin pour lister les contacts
export function useContactSubmissions(options: { page?: number; status?: string } = {}) {
  const { page = 1, status } = options;

  return useQuery({
    queryKey: ['admin', 'contacts', { page, status }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (status) params.set('status', status);
      const res = await fetch(`/api/gestion/contacts?${params}`);
      if (!res.ok) throw new Error('Erreur chargement contacts');
      return res.json();
    },
  });
}

// Hook admin pour un contact specifique
export function useContactDetail(id: string) {
  return useQuery({
    queryKey: ['admin', 'contacts', id],
    queryFn: async () => {
      const res = await fetch(`/api/gestion/contacts/${id}`);
      if (!res.ok) throw new Error('Erreur chargement contact');
      return res.json();
    },
    enabled: !!id,
  });
}

// Mutation admin pour repondre a un contact
export function useAdminReplyContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, message }: { contactId: string; message: string }) => {
      const res = await fetch(`/api/gestion/contacts/${contactId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur envoi reponse');
      }
      return res.json();
    },
    onSuccess: (_, { contactId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'contacts', contactId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'contacts'] });
    },
  });
}

// Mutation admin pour changer le statut d'un contact
export function useUpdateContactStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, status }: { contactId: string; status: string }) => {
      const res = await fetch(`/api/gestion/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur mise a jour');
      }
      return res.json();
    },
    onSuccess: (_, { contactId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'contacts', contactId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'contacts'] });
    },
  });
}
