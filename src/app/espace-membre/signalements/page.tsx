// Page Signalements citoyens

'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Textarea, Alert } from '@/components/ui';

const CATEGORIES = [
  { value: 'voirie', label: 'Voirie et trottoirs', icon: '🚧' },
  { value: 'eclairage', label: 'Eclairage public', icon: '💡' },
  { value: 'proprete', label: 'Proprete et dechets', icon: '🗑️' },
  { value: 'espaces_verts', label: 'Espaces verts', icon: '🌳' },
  { value: 'stationnement', label: 'Stationnement', icon: '🅿️' },
  { value: 'nuisances', label: 'Bruit et nuisances', icon: '🔊' },
  { value: 'securite', label: 'Sécurité', icon: '⚠️' },
  { value: 'autre', label: 'Autre', icon: '📋' },
];

interface MairieInfo {
  mairieEmail: string | null;
  mairieName: string | null;
  zipCode: string | null;
}

interface SignalementResult {
  success: boolean;
  sentToMairie: boolean;
  mairieName: string | null;
}

export default function SignalementsPage() {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [adresse, setAdresse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SignalementResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mairieInfo, setMairieInfo] = useState<MairieInfo | null>(null);

  // Charger les infos mairie au montage
  useEffect(() => {
    fetch('/api/signalements')
      .then((r) => r.json())
      .then(setMairieInfo)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!category) {
      setError('Veuillez selectionner une categorie');
      return;
    }
    if (description.length < 10) {
      setError('La description doit contenir au moins 10 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label || category;
      const res = await fetch('/api/signalements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryLabel,
          description,
          adresse,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'envoi');
        return;
      }

      setResult(data);
      setCategory('');
      setDescription('');
      setAdresse('');
    } catch {
      setError('Erreur de connexion. Veuillez reessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Signalement citoyen</h1>
        <p className="text-gray-500 mt-1">
          Signalez un probleme dans votre commune : trou dans la chaussee, eclairage defaillant, depot sauvage...
        </p>
      </div>

      {/* Info mairie */}
      {mairieInfo && (
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${mairieInfo.mairieEmail ? 'bg-green-500' : 'bg-orange-400'}`} />
          {mairieInfo.mairieEmail ? (
            <span className="text-gray-600">
              Votre signalement sera envoye a <strong>{mairieInfo.mairieName || 'votre mairie'}</strong>
            </span>
          ) : (
            <span className="text-gray-500">
              {mairieInfo.mairieName
                ? `Email de ${mairieInfo.mairieName} non disponible — vous recevrez une copie de votre signalement`
                : 'Renseignez votre code postal dans votre profil pour activer les signalements'}
            </span>
          )}
        </div>
      )}

      {/* Message de succes */}
      {result && (
        <Alert variant="success">
          {result.sentToMairie ? (
            <>Votre signalement a ete transmis a <strong>{result.mairieName || 'votre mairie'}</strong>. Une copie vous a ete envoyee par email.</>
          ) : (
            <>Votre signalement a ete enregistre. Une copie vous a ete envoyee par email.</>
          )}
        </Alert>
      )}

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle>Nouveau signalement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="error">{error}</Alert>
            )}

            {/* Categories en grille */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Que souhaitez-vous signaler ?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      category === cat.value
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <p className="text-xs font-medium text-gray-700 mt-1 leading-tight">{cat.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Adresse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ou se situe le probleme ?
              </label>
              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Ex: 12 rue de la Mairie, devant le n°24..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description du probleme
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Decrivez le probleme de maniere precise : quoi, ou exactement, depuis quand, niveau de gravite..."
                rows={4}
              />
              <p className="text-xs text-gray-400 mt-1">
                {description.length}/10 caracteres minimum
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || !mairieInfo?.zipCode}>
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer le signalement'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
