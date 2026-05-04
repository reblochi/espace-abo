// Modale contact support pour une demarche

'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Input, Textarea } from '@/components/ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  processRéférence: string; // reference espace-abo (DEM-XXX)
  advercityRef?: string | null; // reference Advercity (NXXX) — requise pour envoyer
}

export function ContactSupportModal({ isOpen, onClose, processRéférence, advercityRef }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState(`Question sur la demarche ${processRéférence}`);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILES = 5;
  const MAX_SIZE = 10 * 1024 * 1024;
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  const addFiles = (incoming: File[]) => {
    const valid = incoming.filter(
      (f) => ALLOWED.includes(f.type) && f.size <= MAX_SIZE,
    );
    setFiles((prev) => {
      const merged = [...prev];
      for (const f of valid) {
        if (merged.length >= MAX_FILES) break;
        if (!merged.some((m) => m.name === f.name && m.size === f.size)) {
          merged.push(f);
        }
      }
      return merged;
    });
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!advercityRef) {
      setError("Cette démarche n'est pas encore liée au support. Réessayez plus tard.");
      return;
    }
    if (!message.trim()) {
      setError('Le message ne peut pas être vide.');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('type', 'process');
      fd.append('id', advercityRef);
      fd.append('message', message.trim());
      for (const f of files) {
        fd.append('files', f);
      }

      const res = await fetch('/api/messages/reply', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Erreur lors de l'envoi du message.");
        setSubmitting(false);
        return;
      }

      setMessage('');
      setFiles([]);
      onClose();
      router.push('/espace-membre/messagerie');
    } catch {
      setError('Erreur réseau. Réessayez.');
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contacter le SAV" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Référence
          </label>
          <Input value={processRéférence} disabled />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sujet
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Objet de votre demande"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Decrivez votre question ou probleme..."
            rows={5}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pièces jointes <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED.join(',')}
            className="hidden"
            onChange={(e) => {
              addFiles(Array.from(e.target.files || []));
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(Array.from(e.dataTransfer.files || []));
            }}
            disabled={files.length >= MAX_FILES}
            className="w-full flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 disabled:opacity-50 disabled:cursor-not-allowed transition px-4 py-5 text-sm text-gray-600"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.9A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M9 19l3-3m0 0l3 3m-3-3v-9" />
            </svg>
            <span className="font-medium">Cliquez ou glissez-déposez</span>
            <span className="text-xs text-gray-400">PDF, JPG, PNG, WEBP — 10 Mo max — {MAX_FILES} fichiers max</span>
          </button>

          {files.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {files.map((f, idx) => (
                <li key={`${f.name}-${idx}`} className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="truncate flex-1 text-gray-700">{f.name}</span>
                  <span className="text-xs text-gray-400 shrink-0">{formatSize(f.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-gray-400 hover:text-red-600 shrink-0"
                    aria-label="Retirer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting || !advercityRef}>
            {submitting ? 'Envoi…' : 'Envoyer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
