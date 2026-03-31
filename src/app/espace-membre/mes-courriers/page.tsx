// Page Mes courriers — modèles pré-remplis pour abonnés

'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useProfile } from '@/hooks';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal, Spinner, Alert } from '@/components/ui';

interface CourrierField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface Template {
  id: string;
  category: string;
  title: string;
  description: string;
  fields: CourrierField[];
  recommande?: boolean;
}

interface Courrier {
  id: string;
  templateId: string;
  title: string;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  resiliation: 'Résiliation',
  administratif: 'Administratif',
  logement: 'Logement',
};

export default function MesCourriersPage() {
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const [activeCategory, setActiveCategory] = useState('resiliation');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Charger les templates
  const { data: templatesData } = useQuery({
    queryKey: ['courrier-templates'],
    queryFn: async () => {
      const res = await fetch('/api/courriers/templates');
      if (!res.ok) throw new Error('Erreur chargement');
      return res.json();
    },
  });

  // Charger l'historique + compteur
  const { data: courriersData, isLoading } = useQuery({
    queryKey: ['courriers'],
    queryFn: async () => {
      const res = await fetch('/api/courriers');
      if (!res.ok) throw new Error('Erreur chargement');
      return res.json();
    },
  });

  const templates: Template[] = templatesData?.templates || [];
  const courriers: Courrier[] = courriersData?.courriers || [];
  const monthCount: number = courriersData?.monthCount || 0;
  const monthlyLimit: number = courriersData?.monthlyLimit || 3;
  const filteredTemplates = templates.filter((t) => t.category === activeCategory);
  const quotaReached = monthCount >= monthlyLimit;

  // Reset formulaire quand on change de template
  useEffect(() => {
    if (selectedTemplate) {
      setFormData({});
      setError(null);
    }
  }, [selectedTemplate]);

  // Générer le courrier
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) throw new Error('Aucun modèle sélectionné');
      const res = await fetch('/api/courriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: selectedTemplate.id, data: formData }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur');
      }
      // Télécharger le PDF
      const blob = await res.blob();
      const courrierId = res.headers.get('X-Courrier-Id');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `courrier-${courrierId || 'document'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courriers'] });
      setSelectedTemplate(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    generateMutation.mutate();
  };

  const updateField = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes courriers</h1>
        <p className="text-gray-500 mt-1">Générez des courriers types pré-remplis avec vos informations</p>
      </div>

      {/* Jauge */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Courriers ce mois</span>
            <span className="text-sm font-bold text-gray-900">{monthCount} / {monthlyLimit}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${quotaReached ? 'bg-red-500' : 'bg-blue-600'}`}
              style={{ width: `${Math.min((monthCount / monthlyLimit) * 100, 100)}%` }}
            />
          </div>
          {quotaReached && (
            <p className="text-xs text-red-600 mt-2">Limite mensuelle atteinte. Vos courriers seront disponibles le mois prochain.</p>
          )}
        </CardContent>
      </Card>

      {/* Onglets catégories */}
      <div className="flex gap-2">
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Templates */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer hover:shadow-md transition-shadow ${quotaReached ? 'opacity-50' : ''}`}
            onClick={() => !quotaReached && setSelectedTemplate(template)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 text-sm">{template.title}</h3>
                {template.recommande && (
                  <Badge variant="default">AR</Badge>
                )}
              </div>
              <p className="text-xs text-gray-500">{template.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Historique */}
      {courriers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {courriers.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{c.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <a
                    href={`/api/courriers/${c.id}/download`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Télécharger
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal formulaire */}
      {selectedTemplate && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTemplate(null)}
          title={selectedTemplate.title}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Infos expéditeur (pré-remplies) */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">Expéditeur (vos informations)</p>
              <p>{profile?.firstName} {profile?.lastName}</p>
              {profile?.address && <p>{profile.address}</p>}
              {profile?.zipCode && profile?.city && <p>{profile.zipCode} {profile.city}</p>}
            </div>

            {/* Champs du template */}
            {selectedTemplate.fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => updateField(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={formData[field.name] || ''}
                    onChange={(e) => updateField(field.name, e.target.value)}
                    required={field.required}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Sélectionnez...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) => updateField(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                )}
              </div>
            ))}

            {error && <Alert variant="error">{error}</Alert>}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" type="button" className="flex-1" onClick={() => setSelectedTemplate(null)}>
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={generateMutation.isPending}>
                {generateMutation.isPending ? 'Génération...' : 'Générer le PDF'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
