// Admin - Edition d'un profil de tarification

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PricingProfileData {
  id: string;
  code: string;
  label: string;
  paymentMode: string;
  subscriptionMonthlyPrice: number;
  basePrice: number | null;
  isActive: boolean;
  processCount: number;
}

export default function AdminPricingProfileEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [label, setLabel] = useState('');
  const [paymentMode, setPaymentMode] = useState('both');
  const [subscriptionPriceEur, setSubscriptionPriceEur] = useState('');
  const [basePriceEur, setBasePriceOverrideEur] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: profile, isLoading } = useQuery<PricingProfileData>({
    queryKey: ['admin', 'pricing-profile', id],
    queryFn: async () => {
      const res = await fetch(`/api/gestion/pricing-profiles/${id}`);
      if (!res.ok) throw new Error('Erreur chargement');
      return res.json();
    },
  });

  useEffect(() => {
    if (profile) {
      setLabel(profile.label);
      setPaymentMode(profile.paymentMode);
      setSubscriptionPriceEur((profile.subscriptionMonthlyPrice / 100).toFixed(2));
      setBasePriceOverrideEur(
        profile.basePrice !== null ? (profile.basePrice / 100).toFixed(2) : ''
      );
      setIsActive(profile.isActive);
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async (data: {
      label: string;
      paymentMode: string;
      subscriptionMonthlyPrice: number;
      basePrice: number | null;
      isActive: boolean;
    }) => {
      const res = await fetch(`/api/gestion/pricing-profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erreur sauvegarde');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pricing-profile', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pricing-profiles'] });
      setSaveError('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (error: Error) => {
      setSaveError(error.message);
    },
  });

  const handleSave = () => {
    setSaveError('');
    const subscriptionPriceCents = Math.round(parseFloat(subscriptionPriceEur) * 100);
    const basePriceCents = basePriceEur.trim()
      ? Math.round(parseFloat(basePriceEur) * 100)
      : null;

    if (isNaN(subscriptionPriceCents) || subscriptionPriceCents <= 0) {
      setSaveError('Le prix abonnement doit etre un nombre positif.');
      return;
    }

    saveMutation.mutate({
      label,
      paymentMode,
      subscriptionMonthlyPrice: subscriptionPriceCents,
      basePrice: basePriceCents,
      isActive,
    });
  };

  const handleDeactivate = () => {
    saveMutation.mutate({
      label,
      paymentMode,
      subscriptionMonthlyPrice: Math.round(parseFloat(subscriptionPriceEur) * 100),
      basePrice: basePriceEur.trim()
        ? Math.round(parseFloat(basePriceEur) * 100)
        : null,
      isActive: false,
    });
  };

  if (isLoading) return <div className="text-gray-500">Chargement...</div>;
  if (!profile) return <div className="text-gray-500">Profil non trouve</div>;

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

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Profil : {profile.code}</h1>
        {profile.processCount > 0 && (
          <span className="text-sm text-gray-500">
            {profile.processCount} demarche{profile.processCount > 1 ? 's' : ''} utilisent ce profil
          </span>
        )}
      </div>

      <div className="max-w-xl">
        <Card className="p-6 space-y-5">
          {/* Code (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <input
              type="text"
              value={profile.code}
              readOnly
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Le code ne peut pas etre modifie apres creation.</p>
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Libelle</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Prix abonnement</label>
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

          {/* Erreur / succes */}
          {saveError && (
            <p className="text-sm text-red-600">{saveError}</p>
          )}
          {saveSuccess && (
            <p className="text-sm text-green-600">Modifications enregistrees.</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              isLoading={saveMutation.isPending}
            >
              Enregistrer
            </Button>
            {profile.isActive && (
              <Button
                variant="outline"
                onClick={handleDeactivate}
                disabled={saveMutation.isPending}
              >
                Desactiver
              </Button>
            )}
            <Button variant="ghost" onClick={() => router.back()}>
              Retour
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
