// Page Signalements citoyens - Formulaire + Historique

'use client';

import { useState, useEffect, useRef } from 'react';
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

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

interface MairieInfo {
  mairieEmail: string | null;
  mairieName: string | null;
  mairieFormulaire: string | null;
  zipCode: string | null;
}

interface SignalementFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string | null;
}

interface Signalement {
  id: string;
  category: string;
  description: string;
  adresse: string | null;
  mairieName: string | null;
  sentToMairie: boolean;
  files: SignalementFile[];
  createdAt: string;
}

interface SubmitResult {
  success: boolean;
  sentToMairie: boolean;
  mairieName: string | null;
  mairieFormulaire: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SignalementsPage() {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [adresse, setAdresse] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mairieInfo, setMairieInfo] = useState<MairieInfo | null>(null);
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les infos mairie au montage
  useEffect(() => {
    fetch('/api/signalements')
      .then((r) => r.json())
      .then(setMairieInfo)
      .catch(() => {});
  }, []);

  const loadHistory = async () => {
    if (signalements.length > 0) {
      setShowHistory(!showHistory);
      return;
    }
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/signalements?history=1');
      const data = await res.json();
      setSignalements(data.signalements || []);
      setShowHistory(true);
    } catch {
      // silently fail
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const allFiles = [...selectedFiles, ...newFiles];

    // Validations
    if (allFiles.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} fichiers autorises`);
      return;
    }

    for (const file of newFiles) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" depasse 10 Mo`);
        return;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`"${file.name}" : format non autorise. Acceptes : JPEG, PNG, WebP, PDF`);
        return;
      }
    }

    setError(null);
    setSelectedFiles(allFiles);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

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
      const formData = new FormData();
      formData.append('category', categoryLabel);
      formData.append('description', description);
      if (adresse) formData.append('adresse', adresse);
      for (const file of selectedFiles) {
        formData.append('files', file);
      }

      const res = await fetch('/api/signalements', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'envoi");
        return;
      }

      setResult(data);
      setCategory('');
      setDescription('');
      setAdresse('');
      setSelectedFiles([]);
      // Recharger l'historique si deja ouvert
      if (showHistory) {
        setSignalements([]);
        loadHistory();
      }
    } catch {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Signalement citoyen</h1>
          <p className="text-gray-500 mt-1">
            Signalez un probleme dans votre commune : trou dans la chaussee, eclairage defaillant, depot sauvage...
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadHistory} disabled={loadingHistory}>
          {loadingHistory ? 'Chargement...' : showHistory ? 'Masquer l\'historique' : 'Mes signalements'}
        </Button>
      </div>

      {/* Info mairie */}
      {mairieInfo && (
        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${mairieInfo.mairieEmail ? 'bg-green-500' : mairieInfo.mairieFormulaire ? 'bg-yellow-500' : 'bg-orange-400'}`} />
          {mairieInfo.mairieEmail ? (
            <span className="text-gray-600">
              Votre signalement sera envoye a <strong>{mairieInfo.mairieName || 'votre mairie'}</strong>
            </span>
          ) : mairieInfo.mairieFormulaire ? (
            <span className="text-gray-500">
              {mairieInfo.mairieName || 'Votre mairie'} n&apos;a pas d&apos;email public. Votre signalement sera enregistre et vous recevrez une copie avec le{' '}
              <a href={mairieInfo.mairieFormulaire} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                lien vers leur formulaire de contact
              </a>.
            </span>
          ) : mairieInfo.zipCode ? (
            <span className="text-gray-500">
              Aucune mairie trouvee pour votre code postal — vous recevrez une copie de votre signalement
            </span>
          ) : (
            <span className="text-gray-500">
              Renseignez votre code postal dans votre profil pour activer les signalements
            </span>
          )}
        </div>
      )}

      {/* Message de succes */}
      {result && (
        <Alert variant="success">
          {result.sentToMairie ? (
            <>Votre signalement a ete transmis a <strong>{result.mairieName || 'votre mairie'}</strong>. Une copie vous a ete envoyee par email.</>
          ) : result.mairieFormulaire ? (
            <>
              Votre signalement a ete enregistre. Une copie vous a ete envoyee par email avec le lien vers le{' '}
              <a href={result.mairieFormulaire} target="_blank" rel="noopener noreferrer" className="underline font-medium">
                formulaire de contact de votre mairie
              </a>.
            </>
          ) : (
            <>Votre signalement a ete enregistre. Une copie vous a ete envoyee par email.</>
          )}
        </Alert>
      )}

      {/* Historique */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des signalements</CardTitle>
          </CardHeader>
          <CardContent>
            {signalements.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun signalement pour le moment.</p>
            ) : (
              <div className="space-y-4">
                {signalements.map((s) => (
                  <div key={s.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{s.category}</span>
                          <Badge variant={s.sentToMairie ? 'success' : 'default'}>
                            {s.sentToMairie ? `Envoye a ${s.mairieName || 'la mairie'}` : 'Enregistre'}
                          </Badge>
                        </div>
                        {s.adresse && (
                          <p className="text-sm text-gray-500 mt-1">{s.adresse}</p>
                        )}
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{s.description}</p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(s.createdAt)}</span>
                    </div>
                    {/* Fichiers joints */}
                    {s.files.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {s.files.map((f) => (
                          <a
                            key={f.id}
                            href={f.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs ${
                              f.url
                                ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                : 'border-gray-100 text-gray-400 cursor-default'
                            }`}
                          >
                            {f.mimeType.startsWith('image/') ? '🖼️' : '📄'}
                            <span className="truncate max-w-[120px]">{f.originalName}</span>
                            <span className="text-gray-400">({formatFileSize(f.size)})</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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

            {/* Upload fichiers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photos / pieces jointes <span className="text-gray-400 font-normal">(optionnel, max {MAX_FILES})</span>
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <p className="text-sm text-gray-500">
                  Cliquez pour ajouter des photos ou documents
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPEG, PNG, WebP ou PDF — 10 Mo max par fichier
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Preview fichiers selectionnes */}
              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        {file.type.startsWith('image/') ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-8 h-8 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <span className="text-lg flex-shrink-0">📄</span>
                        )}
                        <span className="truncate text-gray-700">{file.name}</span>
                        <span className="text-gray-400 flex-shrink-0">({formatFileSize(file.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-red-500 ml-2 flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
