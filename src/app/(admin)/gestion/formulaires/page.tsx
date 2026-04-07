// Admin - Gestion des formulaires (config tarification par type + partenaire)

'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const FORM_TYPE_LABELS: Record<string, string> = {
  IDENTITY_CARD: 'Carte d\'identite',
  CIVIL_STATUS_BIRTH: 'Acte de naissance',
  CIVIL_STATUS_MARRIAGE: 'Acte de mariage',
  CIVIL_STATUS_DEATH: 'Acte de deces',
  REGISTRATION_CERT: 'Carte grise',
  NON_PLEDGE_CERT: 'Certificat de non-gage',
  PASSPORT: 'Passeport',
  DRIVING_LICENCE: 'Permis de conduire',
  CRITAIR: 'Vignette Crit\'Air',
  KBIS: 'Extrait Kbis',
  ADDRESS_CHANGE: 'Changement d\'adresse',
  CADASTRE: 'Plan cadastral',
  CRIMINAL_RECORD: 'Casier judiciaire',
};

const FORM_TYPES = Object.keys(FORM_TYPE_LABELS);

const MODE_LABELS: Record<string, string> = {
  both: 'Les deux',
  subscription: 'Abo seul',
  one_time: 'Acte seul',
};

const MODE_COLORS: Record<string, string> = {
  both: 'bg-blue-100 text-blue-700',
  subscription: 'bg-green-100 text-green-700',
  one_time: 'bg-gray-100 text-gray-700',
};

const FORM_TYPE_SLUGS: Record<string, string> = {
  IDENTITY_CARD: 'carte-identite',
  CIVIL_STATUS_BIRTH: 'acte-naissance',
  CIVIL_STATUS_MARRIAGE: 'acte-mariage',
  CIVIL_STATUS_DEATH: 'acte-deces',
  REGISTRATION_CERT: 'carte-grise',
  NON_PLEDGE_CERT: 'certificat-non-gage',
  CRITAIR: 'vignette-critair',
  PASSPORT: 'passeport',
  DRIVING_LICENCE: 'permis-conduire',
  KBIS: 'extrait-kbis',
  ADDRESS_CHANGE: 'changement-adresse',
  CADASTRE: 'plan-cadastral',
  CRIMINAL_RECORD: 'casier-judiciaire',
};

const BASE_URL = 'https://franceguichet.fr';

interface PricingProfile {
  id: string;
  code: string;
  label: string;
  paymentMode: string;
  subscriptionMonthlyPrice: number;
  basePrice: number;
  isActive: boolean;
}

interface FormConfigItem {
  id: string;
  formType: string;
  partner: string;
  pricingProfileId: string;
  pricingProfile: PricingProfile;
  isActive: boolean;
  stats: {
    processCount: number;
    started: number;
    completed: number;
    conversionRate: number;
  };
}

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' EUR';
}

// --- Apercu iframe avec auto-resize ---

function PreviewIframe({ url, label }: { url: string; label: string }) {
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.source === 'advercity-widget' && event.data.type === 'resize') {
        setHeight(event.data.height);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="bg-gray-100 px-3 py-1.5 flex items-center gap-2 border-b">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <span className="text-xs text-gray-400 ml-2 truncate">{label}</span>
      </div>
      <iframe
        src={url}
        width="100%"
        height={height}
        scrolling="no"
        style={{ border: 'none', overflow: 'hidden', transition: 'height 0.2s ease' }}
        allow="payment"
      />
    </div>
  );
}

// --- Modale code d'integration ---

function IntegrationModal({ config, onClose }: { config: FormConfigItem; onClose: () => void }) {
  const [copied, setCopied] = useState('');
  const slug = FORM_TYPE_SLUGS[config.formType] || config.formType.toLowerCase();
  const partner = config.partner !== 'default' ? config.partner : '';
  const pricingCode = config.pricingProfile.code !== 'default' ? config.pricingProfile.code : '';

  const params = new URLSearchParams();
  if (partner) params.set('partner', partner);
  if (pricingCode) params.set('pricing', pricingCode);
  const qs = params.toString() ? `?${params.toString()}` : '';

  const directUrl = `${BASE_URL}/nouvelle-demarche/${slug}${qs}`;
  const embedUrl = `${BASE_URL}/embed/${slug}?partner=${partner || 'default'}${pricingCode ? `&pricing=${pricingCode}` : ''}`;

  const snippets = [
    {
      id: 'link',
      label: 'Lien direct',
      description: 'Simple lien vers le formulaire',
      code: directUrl,
    },
    {
      id: 'iframe',
      label: 'Iframe',
      description: 'Integrer le formulaire dans une page (hauteur auto)',
      code: `<div id="advercity-container" style="max-width: 720px;">
  <iframe
    id="advercity-form"
    src="${embedUrl}"
    width="100%"
    frameborder="0"
    scrolling="no"
    style="border: none; width: 100%; min-height: 800px; display: block;"
    allow="payment"
  ></iframe>
</div>
<script>
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.source !== 'advercity-widget') return;
    var el = document.getElementById('advercity-form');
    if (e.data.type === 'resize' && e.data.height > 0) {
      el.style.height = e.data.height + 'px';
    }
    if (e.data.type === 'scrollTop') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
<\/script>`,
    },
    {
      id: 'widget',
      label: 'Widget JS',
      description: 'Modale par-dessus le site (recommande)',
      code: `<script>
  window.ADVERCITY_CONFIG = {
    baseUrl: '${BASE_URL}',
    partner: '${partner || 'default'}',${pricingCode ? `\n    pricing: '${pricingCode}',` : ''}
  };
</script>
<script src="${BASE_URL}/widget/advercity-widget.js"></script>
<button data-advercity="${slug}"${partner ? ` data-advercity-partner="${partner}"` : ''}${pricingCode ? ` data-advercity-pricing="${pricingCode}"` : ''}>
  ${FORM_TYPE_LABELS[config.formType] || 'Faire ma demarche'}
</button>`,
    },
    {
      id: 'html-react',
      label: 'HTML + React',
      description: 'Page HTML autonome avec React via CDN (sans build)',
      code: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${FORM_TYPE_LABELS[config.formType]}</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
</head>
<body>
  <div id="form-root"></div>
  <script>
    const { createElement: h, useEffect, useState } = React;

    function FormEmbed() {
      const [height, setHeight] = useState(600);

      useEffect(function() {
        function handler(event) {
          if (!event.data || event.data.source !== 'advercity-widget') return;
          if (event.data.type === 'resize') {
            setHeight(event.data.height);
          }
          if (event.data.type === 'complete') {
            alert('Demarche creee : ' + event.data.reference);
          }
          if (event.data.type === 'checkout') {
            window.location.href = event.data.url;
          }
        }
        window.addEventListener('message', handler);
        return function() { window.removeEventListener('message', handler); };
      }, []);

      return h('iframe', {
        src: '${embedUrl}',
        width: '100%',
        height: height,
        style: { border: 'none', maxWidth: 720, display: 'block', margin: '0 auto' },
        allow: 'payment'
      });
    }

    ReactDOM.createRoot(document.getElementById('form-root'))
      .render(h(FormEmbed));
  <\/script>
</body>
</html>`,
    },
  ];

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(id);
      setTimeout(() => setCopied(''), 2000);
    }
  };

  const [activeTab, setActiveTab] = useState(snippets[0].id);
  const [showPreview, setShowPreview] = useState(false);
  const active = snippets.find((s) => s.id === activeTab) || snippets[0];

  // Charger le widget JS pour l'apercu
  useEffect(() => {
    if (showPreview && activeTab === 'widget') {
      // Configurer le widget
      (window as any).ADVERCITY_CONFIG = {
        baseUrl: window.location.origin,
        partner: partner || 'default',
        ...(pricingCode ? { pricing: pricingCode } : {}),
      };
      // Charger le script s'il n'existe pas
      if (!document.getElementById('advercity-widget-preview')) {
        const script = document.createElement('script');
        script.id = 'advercity-widget-preview';
        script.src = `${window.location.origin}/widget/advercity-widget.js`;
        document.body.appendChild(script);
      }
    }
  }, [showPreview, activeTab, partner, pricingCode]);

  const renderPreview = () => {
    switch (activeTab) {
      case 'link':
        return (
          <div className="flex items-center justify-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              {FORM_TYPE_LABELS[config.formType]}
            </a>
          </div>
        );

      case 'iframe':
      case 'html-react':
      case 'react':
        return <PreviewIframe url={embedUrl.replace(BASE_URL, window.location.origin)} label={embedUrl} />;

      case 'widget':
        return (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 gap-4">
            <p className="text-sm text-gray-500">Cliquez sur le bouton pour tester la modale widget</p>
            <button
              data-advercity={slug}
              data-advercity-partner={partner || 'default'}
              {...(pricingCode ? { 'data-advercity-pricing': pricingCode } : {})}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              {FORM_TYPE_LABELS[config.formType]}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Integration : {FORM_TYPE_LABELS[config.formType]}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {partner ? `Partenaire : ${partner}` : 'Sans partenaire'}{pricingCode ? ` / Profil : ${pricingCode}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Integration tabs */}
        <div className="flex border-b flex-shrink-0 overflow-x-auto">
          {snippets.map((snippet) => (
            <button
              key={snippet.id}
              onClick={() => { setActiveTab(snippet.id); setShowPreview(false); }}
              className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === snippet.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {snippet.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">{active.description}</p>
              <div className="flex rounded-md border border-gray-200 overflow-hidden flex-shrink-0 ml-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className={`px-3 py-1 text-xs font-medium ${!showPreview ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Code
                </button>
                <button
                  onClick={() => setShowPreview(true)}
                  className={`px-3 py-1 text-xs font-medium ${showPreview ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  Apercu
                </button>
              </div>
            </div>

            {showPreview ? (
              renderPreview()
            ) : (
              <div className="relative">
                <button
                  onClick={() => copyToClipboard(active.code, active.id)}
                  className={`absolute top-3 right-3 px-3 py-1.5 rounded text-xs font-medium transition-all z-10 ${
                    copied === active.id
                      ? 'bg-green-500 text-white'
                      : 'bg-white/90 text-gray-700 hover:bg-white border border-gray-300'
                  }`}
                >
                  {copied === active.id ? 'Copie !' : 'Copier'}
                </button>
                <pre className="bg-gray-900 rounded-lg p-4 pr-20 overflow-x-auto text-[13px] leading-relaxed">
                  <code className="text-gray-200">{active.code}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FormulairesPage() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [integrationConfig, setIntegrationConfig] = useState<FormConfigItem | null>(null);
  const [newFormType, setNewFormType] = useState('');
  const [newPartner, setNewPartner] = useState('default');
  const [newPricingId, setNewPricingId] = useState('');

  const { data: configs, isLoading } = useQuery<{ items: FormConfigItem[] }>({
    queryKey: ['admin', 'form-configs'],
    queryFn: async () => {
      const res = await fetch('/api/gestion/form-configs');
      if (!res.ok) throw new Error('Erreur');
      return res.json();
    },
  });

  const { data: profiles } = useQuery<{ items: PricingProfile[] }>({
    queryKey: ['admin', 'pricing-profiles'],
    queryFn: async () => {
      const res = await fetch('/api/gestion/pricing-profiles');
      if (!res.ok) return { items: [] };
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { formType: string; partner: string; pricingProfileId: string }) => {
      const res = await fetch('/api/gestion/form-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'form-configs'] });
      setShowAdd(false);
      setNewFormType('');
      setNewPartner('default');
      setNewPricingId('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { pricingProfileId?: string; isActive?: boolean } }) => {
      const res = await fetch(`/api/gestion/form-configs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erreur');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'form-configs'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/gestion/form-configs/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'form-configs'] });
    },
  });

  const activeProfiles = profiles?.items?.filter((p) => p.isActive) || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Formulaires</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          {showAdd ? 'Annuler' : 'Nouvelle configuration'}
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Nouvelle configuration
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de formulaire</label>
              <select
                value={newFormType}
                onChange={(e) => setNewFormType(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Selectionnez...</option>
                {FORM_TYPES.map((ft) => (
                  <option key={ft} value={ft}>{FORM_TYPE_LABELS[ft]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partenaire</label>
              <input
                type="text"
                value={newPartner}
                onChange={(e) => setNewPartner(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
                placeholder="default"
              />
              <p className="text-xs text-gray-400 mt-1">"default" pour la config par defaut</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profil tarification</label>
              <select
                value={newPricingId}
                onChange={(e) => setNewPricingId(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Selectionnez...</option>
                {activeProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.paymentMode === 'one_time' ? `Acte ${formatPrice(p.basePrice)}` : p.paymentMode === 'subscription' ? `Abo ${formatPrice(p.subscriptionMonthlyPrice)}/mois` : `Abo ${formatPrice(p.subscriptionMonthlyPrice)}/mois ou Acte ${formatPrice(p.basePrice)}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => {
              if (newFormType && newPricingId) {
                createMutation.mutate({ formType: newFormType, partner: newPartner || 'default', pricingProfileId: newPricingId });
              }
            }}
            disabled={!newFormType || !newPricingId || createMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creation...' : 'Creer'}
          </button>
          {createMutation.isError && (
            <p className="text-sm text-red-600 mt-2">{(createMutation.error as Error).message}</p>
          )}
        </div>
      )}

      {/* Liste des configurations */}
      {isLoading ? (
        <div className="text-gray-500 text-center py-8">Chargement...</div>
      ) : !configs?.items?.length ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          Aucune configuration. Cliquez sur "Nouvelle configuration" pour associer un profil de tarification a un formulaire.
        </div>
      ) : (
        <div className="space-y-3">
          {configs.items.map((config) => (
            <div
              key={config.id}
              className={`bg-white border rounded-lg p-5 ${config.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {FORM_TYPE_LABELS[config.formType] || config.formType}
                    </h3>
                    {config.partner !== 'default' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                        {config.partner}
                      </span>
                    )}
                    {!config.isActive && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        Inactif
                      </span>
                    )}
                  </div>

                  {/* Pricing info */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${MODE_COLORS[config.pricingProfile.paymentMode]}`}>
                      {MODE_LABELS[config.pricingProfile.paymentMode]}
                    </span>
                    <span>
                      Abo : {formatPrice(config.pricingProfile.subscriptionMonthlyPrice)}/mois
                    </span>
                    <span>
                      Prestation : {formatPrice(config.pricingProfile.basePrice)}
                    </span>
                    <span className="text-gray-400">
                      Profil : {config.pricingProfile.code}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-400">Demarres</span>{' '}
                      <span className="font-semibold text-gray-900">{config.stats.started}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Completes</span>{' '}
                      <span className="font-semibold text-green-700">{config.stats.completed}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Conversion</span>{' '}
                      <span className="font-semibold text-blue-700">{config.stats.conversionRate}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Demarches</span>{' '}
                      <span className="font-semibold text-gray-900">{config.stats.processCount}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setIntegrationConfig(config)}
                    className="text-xs px-2 py-1 rounded font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                    title="Code d'integration"
                  >
                    Integrer
                  </button>

                  <select
                    value={config.pricingProfileId}
                    onChange={(e) => {
                      updateMutation.mutate({ id: config.id, data: { pricingProfileId: e.target.value } });
                    }}
                    className="text-xs border border-gray-200 rounded px-2 py-1"
                    title="Changer le profil"
                  >
                    {activeProfiles.map((p) => (
                      <option key={p.id} value={p.id}>{p.code}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      updateMutation.mutate({ id: config.id, data: { isActive: !config.isActive } });
                    }}
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      config.isActive
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={config.isActive ? 'Desactiver' : 'Reactiver'}
                  >
                    {config.isActive ? 'Desactiver' : 'Activer'}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Supprimer cette configuration ?')) {
                        deleteMutation.mutate(config.id);
                      }
                    }}
                    className="text-xs text-gray-400 hover:text-red-600 px-2 py-1"
                    title="Supprimer"
                  >
                    Suppr.
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale d'integration */}
      {integrationConfig && (
        <IntegrationModal config={integrationConfig} onClose={() => setIntegrationConfig(null)} />
      )}

      {/* Legende */}
      <div className="mt-6 text-xs text-gray-400">
        <p>Les formulaires utilisent le profil de tarification associe. Si aucune configuration n'existe pour un formulaire + partenaire, le profil "default" est utilise.</p>
        <p className="mt-1">Pour l'AB testing, creez plusieurs configurations avec des partenaires differents (ex: "fridefont", "mairiedefridefont") pointant vers des profils differents.</p>
      </div>
    </div>
  );
}
