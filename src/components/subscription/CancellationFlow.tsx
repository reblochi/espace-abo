// Parcours de retention multi-etapes (UI only)

'use client';

import { useState } from 'react';
import { Modal, Button } from '@/components/ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isCanceling: boolean;
  endDate?: string;
}

const reasons = [
  'Je n\'utilise pas assez le service',
  'C\'est trop cher pour moi',
  'Je n\'ai plus besoin de faire de demarches',
  'Le service ne correspond pas a mes attentes',
  'J\'ai trouve une alternative',
  'Autre raison',
];

export function CancellationFlow({ isOpen, onClose, onConfirm, isCanceling, endDate }: Props) {
  const [step, setStep] = useState(1);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  const handleClose = () => {
    setStep(1);
    setSelectedReasons([]);
    onClose();
  };

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Resilier mon abonnement" size="lg">
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Nous sommes desoles de vous voir partir. Pourriez-vous nous dire pourquoi ?
          </p>
          <div className="space-y-2">
            {reasons.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedReasons.includes(reason)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedReasons.includes(reason)}
                  onChange={() => toggleReason(reason)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">{reason}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Finalement, je reste
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setStep(2)}
              disabled={selectedReasons.length === 0}
            >
              Continuer
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🎁</div>
            <h4 className="font-semibold text-blue-900 mb-1">
              Offre speciale pour vous
            </h4>
            <p className="text-sm text-blue-700 mb-3">
              Restez encore un mois et bénéficiez de <strong>-50%</strong> sur votre prochaine échéance !
            </p>
            <p className="text-xs text-blue-600">
              Soit 4.95 EUR au lieu de 9.90 EUR pour le prochain mois
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" onClick={handleClose}>
              J'accepte l'offre
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep(3)}
            >
              Non merci, continuer
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Vous etes sur le point de resilier. Votre abonnement restera actif
            {endDate ? ` jusqu'au ${endDate}` : ' jusqu\'a la fin de la periode en cours'}.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">Ce que vous perdez :</h4>
            <ul className="text-sm text-red-700 space-y-1.5">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Demarches d'etat civil illimitees
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Suivi en temps reel de vos procedures
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Assistance prioritaire
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Coffre-fort numerique et courriers types
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Je reste abonne
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={onConfirm}
              disabled={isCanceling}
            >
              {isCanceling ? 'Resiliation...' : 'Confirmer la resiliation'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
