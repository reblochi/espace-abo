// Page Messagerie

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, Input, Textarea } from '@/components/ui';
import { showComingSoonToast, ComingSoonBadge } from '@/components/ui/coming-soon';

interface Message {
  id: string;
  sender: 'user' | 'support';
  content: string;
  date: string;
}

interface Conversation {
  id: string;
  subject: string;
  status: 'open' | 'closed';
  lastMessage: string;
  date: string;
  unread: boolean;
  messages: Message[];
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    subject: 'Question sur ma demarche DEM-2026-000012',
    status: 'open',
    lastMessage: 'Votre dossier est en cours de traitement...',
    date: '2026-03-03',
    unread: true,
    messages: [
      { id: 'm1', sender: 'user', content: 'Bonjour, je souhaiterais savoir ou en est ma demarche de carte grise.', date: '2026-03-01 10:30' },
      { id: 'm2', sender: 'support', content: 'Bonjour ! Votre dossier est en cours de traitement par nos equipes. Vous devriez recevoir une mise a jour sous 48h.', date: '2026-03-01 14:15' },
      { id: 'm3', sender: 'user', content: 'Merci pour le retour, est-il possible d\'accelerer le traitement ?', date: '2026-03-02 09:00' },
      { id: 'm4', sender: 'support', content: 'Votre dossier est en cours de traitement prioritaire. Nous faisons notre maximum pour vous repondre dans les meilleurs delais.', date: '2026-03-03 11:30' },
    ],
  },
  {
    id: '2',
    subject: 'Probleme de paiement',
    status: 'closed',
    lastMessage: 'Le probleme a ete resolu.',
    date: '2026-02-25',
    unread: false,
    messages: [
      { id: 'm5', sender: 'user', content: 'Mon paiement a ete refuse alors que ma carte est valide.', date: '2026-02-24 16:00' },
      { id: 'm6', sender: 'support', content: 'Nous avons identifie un probleme temporaire avec notre prestataire de paiement. Le probleme a ete resolu. Vous pouvez retenter le paiement.', date: '2026-02-25 10:00' },
    ],
  },
  {
    id: '3',
    subject: 'Demande de remboursement',
    status: 'open',
    lastMessage: 'Nous etudions votre demande...',
    date: '2026-03-01',
    unread: false,
    messages: [
      { id: 'm7', sender: 'user', content: 'Je souhaiterais etre rembourse pour la demarche DEM-2026-000008 qui a ete annulee.', date: '2026-03-01 08:45' },
      { id: 'm8', sender: 'support', content: 'Nous etudions votre demande de remboursement. Nous reviendrons vers vous sous 5 jours ouvres.', date: '2026-03-01 15:20' },
    ],
  },
];

export default function MessageriePage() {
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(mockConversations[0]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messagerie</h1>
          <p className="text-gray-500 mt-1">
            Echangez avec notre equipe support
          </p>
        </div>
        <Button onClick={() => setShowNewModal(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nouveau message
        </Button>
      </div>

      {/* Layout conversations */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Liste des conversations */}
        <div className="space-y-2">
          {mockConversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setSelectedConv(conv)}
              className={`w-full text-left p-4 rounded-lg border transition-colors ${
                selectedConv?.id === conv.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-medium text-sm text-gray-900 truncate pr-2">{conv.subject}</h3>
                {conv.unread && (
                  <span className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                )}
              </div>
              <p className="text-xs text-gray-500 truncate mb-2">{conv.lastMessage}</p>
              <div className="flex items-center justify-between">
                <Badge variant={conv.status === 'open' ? 'success' : 'secondary'}>
                  {conv.status === 'open' ? 'Ouvert' : 'Ferme'}
                </Badge>
                <span className="text-xs text-gray-400">{conv.date}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Fil de messages */}
        <div className="lg:col-span-2">
          {selectedConv ? (
            <Card className="h-full">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{selectedConv.subject}</CardTitle>
                  <Badge variant={selectedConv.status === 'open' ? 'success' : 'secondary'}>
                    {selectedConv.status === 'open' ? 'Ouvert' : 'Ferme'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages */}
                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                  {selectedConv.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${
                          msg.sender === 'user' ? 'text-blue-200' : 'text-gray-400'
                        }`}>
                          {msg.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Zone de reponse */}
                {selectedConv.status === 'open' && (
                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Votre message..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') showComingSoonToast();
                        }}
                      />
                      <Button onClick={() => showComingSoonToast()}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500">Selectionnez une conversation</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Chatbot IA flottant */}
      <div className="fixed bottom-24 md:bottom-6 right-6 z-20">
        {showChatbot && (
          <Card className="w-80 mb-3 shadow-xl">
            <CardHeader className="bg-blue-600 text-white rounded-t-lg py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <span className="font-medium text-sm">Assistant IA</span>
                  <ComingSoonBadge className="bg-blue-400 text-white" />
                </div>
                <button onClick={() => setShowChatbot(false)} className="text-blue-200 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5 mb-4">
                <p className="text-sm text-gray-700">
                  Bonjour ! Comment puis-je vous aider aujourd'hui ?
                </p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Posez votre question..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') showComingSoonToast();
                  }}
                />
                <Button size="sm" onClick={() => showComingSoonToast()}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        <button
          onClick={() => setShowChatbot(!showChatbot)}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>

      {/* Modal nouveau message */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="Nouveau message" size="md">
        <form onSubmit={(e) => { e.preventDefault(); setShowNewModal(false); showComingSoonToast(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
            <Input placeholder="Objet de votre message" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <Textarea placeholder="Decrivez votre demande..." rows={5} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowNewModal(false)}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              Envoyer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
