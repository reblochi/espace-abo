// Section analytique formulaires pour le dashboard admin
// Funnels, conversion par pricing/partenaire, breakdown paiement

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FunnelChart } from './FunnelChart';
import { formatCurrency } from '@/lib/utils';

const PERIODS = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: 'all', label: 'Tout' },
];

const FORM_TYPES = [
  { value: '', label: 'Tous les formulaires' },
  { value: 'IDENTITY_CARD', label: 'Carte d\'identite' },
  { value: 'CIVIL_STATUS_BIRTH', label: 'Acte de naissance' },
  { value: 'REGISTRATION_CERT', label: 'Carte grise' },
];

interface FunnelData {
  formType: string;
  steps: { stepIndex: number; stepName: string; entered: number; completed: number; dropOffRate: number }[];
  totalStarted: number;
  totalCompleted: number;
  conversionRate: number;
}

interface AnalyticsData {
  funnels: FunnelData[];
  byPricing: { pricingCode: string; total: number; completed: number; conversionRate: number }[];
  byPartner: { partner: string; source: string; total: number }[];
  paymentBreakdown: { subscription: number; oneTime: number };
}

export function AnalyticsSection() {
  const [period, setPeriod] = useState('30d');
  const [formType, setFormType] = useState('');
  const [pricingFilter, setPricingFilter] = useState('');

  // Charger les profils pricing pour le filtre
  const { data: pricingProfiles } = useQuery<{ items: { id: string; code: string; label: string; isActive: boolean }[] }>({
    queryKey: ['admin', 'pricing-profiles'],
    queryFn: async () => {
      const res = await fetch('/api/gestion/pricing-profiles');
      if (!res.ok) return { items: [] };
      return res.json();
    },
  });

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['admin', 'analytics', period, formType, pricingFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (formType) params.set('formType', formType);
      if (pricingFilter) params.set('pricingCode', pricingFilter);
      const res = await fetch(`/api/gestion/analytics?${params}`);
      if (!res.ok) throw new Error('Erreur chargement analytics');
      return res.json();
    },
    refetchInterval: 60000,
  });

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-md border border-gray-200 overflow-hidden">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                period === p.value
                  ? 'bg-blue-700 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <select
          value={formType}
          onChange={(e) => setFormType(e.target.value)}
          className="text-sm border border-gray-200 rounded-md px-3 py-1.5"
        >
          {FORM_TYPES.map((ft) => (
            <option key={ft.value} value={ft.value}>{ft.label}</option>
          ))}
        </select>

        <select
          value={pricingFilter}
          onChange={(e) => setPricingFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-md px-3 py-1.5"
        >
          <option value="">Tous les profils</option>
          {pricingProfiles?.items?.map((p) => (
            <option key={p.id} value={p.code}>{p.code} — {p.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-gray-500 text-sm">Chargement des analytics...</div>
      ) : !data ? (
        <div className="text-gray-400 text-sm">Aucune donnee</div>
      ) : (
        <>
          {/* KPIs rapides */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">Formulaires demarres</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.funnels.reduce((s, f) => s + f.totalStarted, 0)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">Formulaires completes</p>
              <p className="text-2xl font-bold text-green-700">
                {data.funnels.reduce((s, f) => s + f.totalCompleted, 0)}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">Via abonnement</p>
              <p className="text-2xl font-bold text-blue-700">{data.paymentBreakdown.subscription}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500">Paiement a l'acte</p>
              <p className="text-2xl font-bold text-gray-900">{data.paymentBreakdown.oneTime}</p>
            </div>
          </div>

          {/* Funnels */}
          {data.funnels.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Parcours par etape
              </h3>
              <div className="space-y-4">
                {data.funnels.map((funnel) => (
                  <FunnelChart key={funnel.formType} {...funnel} />
                ))}
              </div>
            </div>
          )}

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Par profil pricing */}
            {data.byPricing.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Par profil pricing
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2 font-medium">Profil</th>
                      <th className="pb-2 font-medium text-right">Total</th>
                      <th className="pb-2 font-medium text-right">Completes</th>
                      <th className="pb-2 font-medium text-right">Conv.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byPricing.map((row) => (
                      <tr key={row.pricingCode} className="border-b border-gray-50">
                        <td className="py-2 font-medium text-gray-900">{row.pricingCode}</td>
                        <td className="py-2 text-right text-gray-600">{row.total}</td>
                        <td className="py-2 text-right text-gray-600">{row.completed}</td>
                        <td className="py-2 text-right font-semibold text-blue-700">{row.conversionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Par partenaire */}
            {data.byPartner.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Par partenaire / source
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2 font-medium">Partenaire</th>
                      <th className="pb-2 font-medium">Source</th>
                      <th className="pb-2 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byPartner.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 font-medium text-gray-900">{row.partner}</td>
                        <td className="py-2 text-gray-600">{row.source}</td>
                        <td className="py-2 text-right text-gray-600">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Message si aucune donnee */}
          {data.funnels.length === 0 && data.byPricing.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Aucune donnee de tracking pour cette periode.
              Les statistiques apparaitront une fois que des utilisateurs auront utilise les formulaires.
            </div>
          )}
        </>
      )}
    </div>
  );
}
