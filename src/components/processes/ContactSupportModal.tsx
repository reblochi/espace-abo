// Modale contact support pour une demarche

'use client';

import { useState } from 'react';
import { Modal, Button, Input, Textarea } from '@/components/ui';
import { showComingSoonToast } from '@/components/ui/coming-soon';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  processReference: string;
}

export function ContactSupportModal({ isOpen, onClose, processReference }: Props) {
  const [subject, setSubject] = useState(`Question sur la demarche ${processReference}`);
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showComingSoonToast();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contacter le support" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference
          </label>
          <Input value={processReference} disabled />
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
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" className="flex-1">
            Envoyer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
