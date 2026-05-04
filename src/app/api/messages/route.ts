// API Route - Messagerie membre (GET conversations)
// Agrege les messages demarches (Advercity) et les contacts FranceGuichet (local)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { advercityClient, signAdvercityCustomer } from '@/lib/advercity';
import type { Conversation, MessageItem } from '@/hooks/useMessages';

interface AdvercityMessage {
  id: number;
  process_id: number;
  process_reference: string;
  process_step: number;
  subject: string | null;
  message: string | null;
  from_address: string | null;
  to: string[];
  sender_type: 'customer' | 'operator' | 'system';
  is_automatic: boolean;
  sent_at: string | null;
  unread: boolean;
  attachments: { id: number; file_name: string }[];
}

// Step >= 100 = demarche terminee dans Advercity
const COMPLETED_STEP = 100;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
  }

  try {
    const [advercityConversations, localConversations] = await Promise.all([
      user.advercityCustomerId
        ? fetchAdvercityConversations(user.advercityCustomerId)
        : Promise.resolve([]),
      fetchLocalConversations(user.email),
    ]);

    // Fusionner et trier par date du dernier message (plus recent d'abord)
    const conversations = [...advercityConversations, ...localConversations].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Messages fetch error:', error);
    return NextResponse.json({ conversations: [] });
  }
}

async function fetchAdvercityConversations(advercityCustomerId: string): Promise<Conversation[]> {
  try {
    const sig = signAdvercityCustomer(advercityCustomerId);
    const response = await advercityClient.get<AdvercityMessage[]>('/api/external/messages', {
      params: {
        customer_id: sig.customer_id,
        expires: sig.expires,
        signature: sig.signature,
      },
    });

    const messages = response.data;
    if (!messages || messages.length === 0) return [];

    // Grouper par process_reference
    const grouped = new Map<string, AdvercityMessage[]>();
    for (const msg of messages) {
      const key = msg.process_reference;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(msg);
    }

    const conversations: Conversation[] = [];
    for (const [processRef, msgs] of grouped) {
      const sorted = msgs.sort((a, b) =>
        new Date(a.sent_at || '').getTime() - new Date(b.sent_at || '').getTime()
      );
      const lastMsg = sorted[sorted.length - 1];
      const firstMsg = sorted[0];

      const mappedMessages: MessageItem[] = sorted.map((m) => ({
        id: String(m.id),
        sender: m.sender_type === 'customer' ? 'user' : 'support',
        senderName: m.sender_type === 'system' ? 'Système' : undefined,
        content: stripHtml(m.message || ''),
        date: m.sent_at || '',
        attachments: m.attachments,
      }));

      conversations.push({
        id: `adv-${firstMsg.process_id}`,
        type: 'process',
        subject: `Démarche ${processRef}`,
        status: (firstMsg.process_step || 0) >= COMPLETED_STEP ? 'closed' : 'open',
        lastMessage: stripHtml(lastMsg.message || '').substring(0, 100),
        date: lastMsg.sent_at || '',
        unread: msgs.some((m) => m.unread && m.sender_type !== 'customer'),
        messages: mappedMessages,
      });
    }

    return conversations;
  } catch {
    // Si Advercity n'est pas joignable, on retourne vide
    return [];
  }
}

async function fetchLocalConversations(email: string): Promise<Conversation[]> {
  const submissions = await prisma.contactSubmission.findMany({
    where: { email: email.toLowerCase() },
    include: {
      replies: { orderBy: { sentAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return submissions.map((sub) => {
    const allMessages: MessageItem[] = [
      {
        id: `init-${sub.id}`,
        sender: 'user',
        content: sub.message,
        date: sub.createdAt.toISOString(),
      },
      ...sub.replies.map((r) => ({
        id: r.id,
        sender: (r.sender === 'admin' ? 'support' : 'user') as 'user' | 'support',
        senderName: r.senderName || undefined,
        content: r.message,
        date: r.sentAt.toISOString(),
      })),
    ];

    const lastMsg = allMessages[allMessages.length - 1];

    return {
      id: `ctt-${sub.id}`,
      type: 'contact' as const,
      subject: `[${sub.reference}] ${subjectLabel(sub.subject)}`,
      status: (['RESOLVED', 'CLOSED'].includes(sub.status) ? 'closed' : 'open') as 'open' | 'closed',
      lastMessage: lastMsg.content.substring(0, 100),
      date: lastMsg.date,
      unread: sub.status === 'WAITING_CUSTOMER' || (sub.replies.length > 0 && sub.replies[sub.replies.length - 1].sender === 'admin'),
      messages: allMessages,
    };
  });
}

function subjectLabel(subject: string): string {
  const labels: Record<string, string> = {
    DEMARCHE: 'Démarche',
    ABONNEMENT: 'Abonnement',
    TECHNIQUE: 'Technique',
    SIGNALEMENT: 'Signalement',
    RETRACTATION: 'Rétractation',
    DONNEES: 'Données',
    AUTRE: 'Autre',
  };
  return labels[subject] || subject;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
