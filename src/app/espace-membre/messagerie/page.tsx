// Page Messagerie

'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { useMessages, useReplyToMessage } from '@/hooks/useMessages';
import type { Conversation } from '@/hooks/useMessages';
import Link from 'next/link';

export default function MessageriePage() {
  const { data, isLoading, error } = useMessages();
  const replyMutation = useReplyToMessage();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [showChatbot, setShowChatbot] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const conversations = data?.conversations || [];
  const selectedConv = conversations.find((c) => c.id === selectedConvId) || conversations[0] || null;

  // Auto-scroll quand les messages changent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv?.messages.length]);

  const handleSend = async () => {
    if (!replyText.trim() || !selectedConv) return;

    const convType = selectedConv.type;
    // Extraire l'ID reel : "adv-123" -> advercityRef, "ctt-xxx" -> contactId
    let id: string;
    if (convType === 'process') {
      // Pour les demarches, on a besoin de l'advercityRef (extrait du sujet)
      const refMatch = selectedConv.subject.match(/Démarche\s+(\S+)/);
      id = refMatch ? refMatch[1] : selectedConv.id.replace('adv-', '');
    } else {
      id = selectedConv.id.replace('ctt-', '');
    }

    try {
      await replyMutation.mutateAsync({
        type: convType,
        id,
        message: replyText.trim(),
        files: replyFiles.length > 0 ? replyFiles : undefined,
      });
      setReplyText('');
      setReplyFiles([]);
    } catch {
      // Erreur affichee par le mutation state
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) +
        ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messagerie</h1>
          <p className="text-gray-500 mt-1">Echangez avec notre équipe support</p>
        </div>
        <Link href="/contact">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouveau message
          </Button>
        </Link>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 mt-3">Chargement des conversations...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-red-500">Erreur lors du chargement des messages</p>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && !error && conversations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-500 mb-4">Aucune conversation pour le moment</p>
            <Link href="/contact">
              <Button variant="outline">Nous contacter</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Layout conversations */}
      {!isLoading && conversations.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Liste des conversations */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
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
                  <div className="flex gap-1.5">
                    <Badge variant={conv.type === 'process' ? 'info' : 'secondary'}>
                      {conv.type === 'process' ? 'Démarche' : 'Support'}
                    </Badge>
                    <Badge variant={conv.status === 'open' ? 'success' : 'secondary'}>
                      {conv.status === 'open' ? 'Ouvert' : 'Fermé'}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(conv.date)}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Fil de messages */}
          <div className="lg:col-span-2">
            {selectedConv ? (
              <Card className="h-full flex flex-col">
                <CardHeader className="border-b flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{selectedConv.subject}</CardTitle>
                    <div className="flex gap-1.5">
                      <Badge variant={selectedConv.type === 'process' ? 'info' : 'secondary'}>
                        {selectedConv.type === 'process' ? 'Démarche' : 'Support'}
                      </Badge>
                      <Badge variant={selectedConv.status === 'open' ? 'success' : 'secondary'}>
                        {selectedConv.status === 'open' ? 'Ouvert' : 'Fermé'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col">
                  {/* Messages */}
                  <div className="p-4 space-y-4 max-h-96 overflow-y-auto flex-1">
                    {selectedConv.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                            msg.sender === 'user'
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : msg.sender === 'system'
                              ? 'bg-amber-50 text-amber-900 rounded-bl-md border border-amber-200'
                              : 'bg-gray-100 text-gray-900 rounded-bl-md'
                          }`}
                        >
                          {msg.senderName && msg.sender !== 'user' && (
                            <p className={`text-[10px] font-medium mb-0.5 ${
                              msg.sender === 'system' ? 'text-amber-600' : 'text-gray-500'
                            }`}>
                              {msg.senderName}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {msg.attachments.map((att) => (
                                <a
                                  key={att.id}
                                  href={`/api/messages/attachments/${att.id}`}
                                  target="_blank"
                                  rel="noopener"
                                  className="inline-flex items-center gap-1 text-[10px] bg-white/20 hover:bg-white/30 rounded px-1.5 py-0.5 underline"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                  </svg>
                                  {att.file_name}
                                </a>
                              ))}
                            </div>
                          )}
                          <p className={`text-[10px] mt-1 ${
                            msg.sender === 'user' ? 'text-blue-200' : msg.sender === 'system' ? 'text-amber-400' : 'text-gray-400'
                          }`}>
                            {formatDate(msg.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Zone de reponse */}
                  {selectedConv.status === 'open' && (
                    <div className="border-t p-4 flex-shrink-0">
                      {replyMutation.error && (
                        <p className="text-red-500 text-xs mb-2">
                          {replyMutation.error.message}
                        </p>
                      )}
                      {/* Fichiers joints */}
                      {replyFiles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {replyFiles.map((f, i) => (
                            <span key={i} className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-2.5 py-1 text-xs text-gray-700">
                              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              {f.name}
                              <button
                                type="button"
                                onClick={() => setReplyFiles((prev) => prev.filter((_, idx) => idx !== i))}
                                className="text-gray-400 hover:text-red-500 ml-0.5"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          title="Joindre un fichier"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const newFiles = Array.from(e.target.files || []).filter(
                              (f) => f.size <= 10 * 1024 * 1024 && ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(f.type),
                            );
                            setReplyFiles((prev) => [...prev, ...newFiles].slice(0, 5));
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Votre message..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSend();
                            }
                          }}
                          disabled={replyMutation.isPending}
                        />
                        <Button
                          onClick={handleSend}
                          disabled={!replyText.trim() || replyMutation.isPending}
                        >
                          {replyMutation.isPending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          )}
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
                  <p className="text-gray-500">Sélectionnez une conversation</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Chatbot IA flottant (coming soon) */}
      <div className="fixed bottom-24 md:bottom-6 right-6 z-20">
        {showChatbot && (
          <Card className="w-80 mb-3 shadow-xl">
            <CardHeader className="bg-blue-600 text-white rounded-t-lg py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">&#129302;</span>
                  <span className="font-medium text-sm">Assistant IA</span>
                  <span className="bg-blue-400 text-white text-[10px] px-1.5 py-0.5 rounded-full">Bientôt</span>
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
                  Bonjour ! L&apos;assistant IA sera bientôt disponible pour répondre à vos questions.
                </p>
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
    </div>
  );
}
