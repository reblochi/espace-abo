// Admin - Creation d'un profil de tarification

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminPricingProfileNewPage() {
  const router = useRouter();

  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [paymentMode, setPaymentMode] = useState('both');
  const [subscriptionPriceEur, setSubscriptionPriceEur] = useState('9.90');
  const [basePriceEur, setBasePriceOverrideEur] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data: {
      code: string;
      label: string;
      paymentMode: string;
      subscriptionMonthlyPrice: number;
      basePrice: number | null;
      isActive: boolean;
    }) => {
      const res = await fetch('/api/gestion/pricing-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur creation');
      return res.json();
    },
    onSuccess: (data) => {
      router.push(`/gestion/tarification/${data.id}`);
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  const handleCreate = () => {
    setFormError('');

    const codeClean = code.trim();
    if (!codeClean) {
      setFormError('Le code est requis.');
      return;
    }
    if (!/^[a-zA-Z0-9-]+$/.test(codeClean)) {
      setFormError('Le code ne peut contenir que des lettres, chiffres et tirets (pas d\'espaces).');
      return;
    }
    if (!label.trim()) {
      setFormError('Le libelle est requis.');
      return;
    }

    const subscriptionPriceCents = Math.round(parseFloat(subscriptionPriceEur) * 100);
    if (isNaN(subscriptionPriceCents) || subscriptionPriceCents <= 0) {
      setFormError('Le prix abonnement doit etre un nombre positif.');
      return;
    }

    const basePriceCents = basePriceEur.trim()
      ? Math.round(parseFloat(basePriceEur) * 100)
      : null;

    createMutation.mutate({
      code: codeClean,
      label: label.trim(),
      paymentMode,
      subscriptionMonthlyPrice: subscriptionPriceCents,
      basePrice: basePriceCents,
      isActive,
    });
  };

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

      <h1 className="text-xl font-semibold text-gray-900 mb-6">Nouveau profil de tarification</h1>

      <div className="max-w-xl">
        <Card className="p-6 space-y-5">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ex: default, A, promo-ete"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Lettres, chiffres et tirets uniquement. Ne pourra pas etre modifie apres creation.
            </p>
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Libelle *</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ex: Profil standard, Offre promotionnelle"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Mode de paiement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="both">Les deux (both)</option>
              <option value="subscription">Abonnement seul (subscription)</option>
              <option value="one_time">Paiement a l&apos;acte seul (one_time)</option>
            </select>
          </div>

          {/* Prix abonnement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix abonnement *</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={subscriptionPriceEur}
                onChange={(e) => setSubscriptionPriceEur(e.target.value)}
                className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">EUR/mois</span>
            </div>
          </div>

          {/* Surcharge prix prestation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Surcharge prix prestation</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={basePriceEur}
                onChange={(e) => setBasePriceOverrideEur(e.target.value)}
                placeholder="Laisser vide"
                className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500">EUR</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Laisser vide pour utiliser le prix par defaut de la demarche.
            </p>
          </div>

          {/* Actif */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Profil actif</span>
            </label>
          </div>

          {/* Erreur */}
          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              isLoading={createMutation.isPending}
            >
              Creer le profil
            </Button>
            <Button variant="ghost" onClick={() => router.back()}>
              Annuler
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
