// Formulaire multi-etapes pour signalement mairie (demarche gratuite)

'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { useProfile } from '@/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import {
  signalementMairieSchema,
  SIGNALEMENT_CATEGORIES,
  type SignalementMairieInput,
} from '@/schemas/signalement-mairie';
import { useFormTracking } from '@/hooks/useFormTracking';

export interface SignalementMairieFormProps {
  onComplete: (reference: string) => void;
}

type Step = {
  id: string;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    id: 'category',
    title: 'Categorie',
    description: 'Quel probleme souhaitez-vous signaler ?',
  },
  {
    id: 'location',
    title: 'Localisation',
    description: 'Ou se situe le probleme ?',
  },
  {
    id: 'description',
    title: 'Description',
    description: 'Decrivez le probleme en detail',
  },
  {
    id: 'contact',
    title: 'Coordonnees',
    description: 'Vos informations de contact',
  },
  {
    id: 'summary',
    title: 'Validation',
    description: 'Verifiez et envoyez votre signalement',
  },
];

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function SignalementMairieForm({ onComplete }: SignalementMairieFormProps) {
  const { data: session } = useSession();
  const { profile } = useProfile();
  const router = useRouter();
  const isAuthenticated = !!session?.user;

  const tracking = useFormTracking({
    formType: 'SIGNALEMENT_MAIRIE',
    source: 'direct',
  });

  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [isGeolocating, setIsGeolocating] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const methods = useForm<SignalementMairieInput>({
    resolver: zodResolver(signalementMairieSchema),
    defaultValues: {
      category: undefined,
      zipCode: '',
      city: '',
      adresse: '',
      description: '',
      requesterFirstName: '',
      requesterLastName: '',
      email: '',
      emailConfirm: '',
      telephone: '',
      consents: {
        acceptTerms: false as unknown as true,
        acceptDataProcessing: false as unknown as true,
      },
    },
    mode: 'onSubmit',
  });

  const { trigger, watch, setValue, register, formState: { errors } } = methods;

  // Pre-remplir depuis le profil
  React.useEffect(() => {
    if (!profile) return;
    const current = methods.getValues();
    if (!current.requesterFirstName) setValue('requesterFirstName', profile.firstName || '');
    if (!current.requesterLastName) setValue('requesterLastName', profile.lastName || '');
    if (!current.email) setValue('email', profile.email || '');
    if (!current.emailConfirm) setValue('emailConfirm', profile.email || '');
    if (!current.telephone && profile.phone) setValue('telephone', profile.phone);
    if (!current.zipCode && profile.zipCode) setValue('zipCode', profile.zipCode);
    if (!current.city && profile.city) setValue('city', profile.city);
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track step changes + hash pour bouton retour
  React.useEffect(() => {
    tracking.trackStepEntered(currentStep, STEPS[currentStep]?.id || 'unknown');
    if (currentStep > 0) {
      const hash = `#step-${currentStep}`;
      if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    } else if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // Intercepter le bouton retour navigateur
  React.useEffect(() => {
    const handleHashChange = () => {
      const match = window.location.hash.match(/^#step-(\d+)$/);
      const hashStep = match ? parseInt(match[1], 10) : 0;
      if (hashStep < currentStep) {
        setError(null);
        setCurrentStep(hashStep);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentStep]);

  // Champs a valider par etape
  const stepFieldsMap: Record<string, (keyof SignalementMairieInput)[]> = {
    category: ['category'],
    location: ['zipCode', 'city'],
    description: ['description'],
    contact: ['requesterFirstName', 'requesterLastName', 'email', 'emailConfirm'],
    summary: ['consents'],
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    const stepId = STEPS[currentStep]?.id;
    const fieldsToValidate = stepFieldsMap[stepId];
    if (!fieldsToValidate || fieldsToValidate.length === 0) return true;
    const fieldsValid = await trigger(fieldsToValidate);
    if (stepId === 'contact') {
      let valid = true;
      const values = methods.getValues();
      if (values.email !== values.emailConfirm) {
        methods.setError('emailConfirm', { type: 'manual', message: 'Les 2 adresses email ne sont pas identiques' });
        valid = false;
      }
      if (values.telephone) {
        const tel = values.telephone.replace(/[\s\-.]/g, '') || '';
        if (tel && !/^0[0-9]{9}$/.test(tel)) {
          methods.setError('telephone', { type: 'manual', message: 'Format invalide (exemple : 06 12 34 56 78)' });
          valid = false;
        }
      }
      if (!fieldsValid) return false;
      return valid;
    }
    return fieldsValid;
  };

  const scrollFormTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < STEPS.length - 1) {
      tracking.trackStepCompleted(currentStep, STEPS[currentStep].id);
      setCurrentStep(currentStep + 1);
      scrollFormTop();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setError(null);
      setCurrentStep(currentStep - 1);
      scrollFormTop();
    }
  };

  // Gestion fichiers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const allFiles = [...selectedFiles, ...newFiles];

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

  // Soumission
  const handleFormSubmit = async (data: SignalementMairieInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const processData = {
        category: data.category,
        categoryLabel: SIGNALEMENT_CATEGORIES.find(c => c.value === data.category)?.label || data.category,
        zipCode: data.zipCode,
        city: data.city,
        adresse: data.adresse || '',
        description: data.description,
        requesterFirstName: data.requesterFirstName,
        requesterLastName: data.requesterLastName,
        email: data.email,
        telephone: data.telephone || '',
      };

      // Utiliser l'API publique (cree le compte si besoin + auto-login)
      const apiUrl = isAuthenticated ? '/api/processes' : '/api/processes/public';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isAuthenticated
            ? { type: 'SIGNALEMENT_MAIRIE', isFreeProfile: true, source: 'direct', data: processData }
            : { type: 'SIGNALEMENT_MAIRIE', source: 'direct', data: processData }
        ),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Une erreur est survenue');
        return;
      }

      // Upload des fichiers si presents
      if (selectedFiles.length > 0 && result.process?.id) {
        const formData = new FormData();
        for (const file of selectedFiles) {
          formData.append('files', file);
        }
        formData.append('processId', result.process.id);
        formData.append('fileType', 'AUTRE');

        try {
          await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData,
          });
        } catch {
          console.error('Erreur upload fichiers');
        }
      }

      tracking.trackFormCompleted(result.process?.id);

      // Si un token d'auto-login est retourne, connecter automatiquement via redirect
      if (result.autoLoginToken) {
        const callbackUrl = '/espace-membre/signalements';
        window.location.href = `/api/auth/auto-login?token=${encodeURIComponent(result.autoLoginToken)}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
        return;
      }

      // Utilisateur connecte: rediriger vers la page signalements
      router.push('/espace-membre/signalements');
      return;
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Geolocalisation navigateur -> code postal + commune via API geo.gouv.fr
  const handleGeolocate = async () => {
    if (!navigator.geolocation) {
      setError('La geolocalisation n\'est pas supportee par votre navigateur.');
      return;
    }

    setIsGeolocating(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocoding via API geo.api.gouv.fr
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?lat=${latitude}&lon=${longitude}&fields=nom,codesPostaux&limit=1`
      );

      if (!res.ok) throw new Error('Erreur API geo');

      const communes = await res.json();
      if (communes.length === 0) {
        setError('Aucune commune trouvee a votre position. Remplissez manuellement.');
        return;
      }

      const commune = communes[0];
      const zipCode = commune.codesPostaux?.[0] || '';

      setValue('zipCode', zipCode, { shouldValidate: true });
      setValue('city', commune.nom || '', { shouldValidate: true });

      // Reverse geocoding adresse via API adresse.data.gouv.fr
      try {
        const addrRes = await fetch(
          `https://api-adresse.data.gouv.fr/reverse/?lon=${longitude}&lat=${latitude}&limit=1`
        );
        if (addrRes.ok) {
          const addrData = await addrRes.json();
          if (addrData.features?.length > 0) {
            const label = addrData.features[0].properties?.label || '';
            if (label) {
              setValue('adresse', label);
            }
          }
        }
      } catch {
        // L'adresse precise est optionnelle, on ignore
      }
    } catch (err) {
      const geoError = err as GeolocationPositionError;
      if (geoError.code === 1) {
        setError('Vous avez refuse l\'acces a votre position. Remplissez manuellement.');
      } else if (geoError.code === 2) {
        setError('Position indisponible. Remplissez manuellement.');
      } else if (geoError.code === 3) {
        setError('Delai de localisation depasse. Remplissez manuellement.');
      } else {
        setError('Erreur de localisation. Remplissez manuellement.');
      }
    } finally {
      setIsGeolocating(false);
    }
  };

  const watchCategory = watch('category');
  const watchDescription = watch('description');

  // Rendu des etapes
  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'category':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Que souhaitez-vous signaler ?</h2>
              <p className="form-gov-hint">Selectionnez la categorie qui correspond le mieux a votre signalement.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SIGNALEMENT_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setValue('category', cat.value, { shouldValidate: true })}
                  className={cn(
                    'p-4 rounded-lg border text-left transition-all',
                    watchCategory === cat.value
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <p className="text-sm font-medium text-gray-700 mt-2 leading-tight">{cat.label}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-tight">{cat.description}</p>
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="form-gov-error-msg">{errors.category.message as string}</p>
            )}
          </div>
        );

      case 'location': {
        const zipValue = watch('zipCode');
        const cityValue = watch('city');
        const fieldsEmpty = !zipValue && !cityValue;

        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Ou se situe le probleme ?</h2>
              <p className="form-gov-hint">Indiquez la commune et, si possible, l&apos;adresse precise.</p>
            </div>

            {/* Bouton geolocalisation */}
            {fieldsEmpty && typeof navigator !== 'undefined' && 'geolocation' in navigator && (
              <button
                type="button"
                onClick={handleGeolocate}
                disabled={isGeolocating}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-colors text-sm font-medium"
              >
                {isGeolocating ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Localisation en cours...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Utiliser ma position actuelle
                  </>
                )}
              </button>
            )}

            {fieldsEmpty && typeof navigator !== 'undefined' && 'geolocation' in navigator && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">ou remplissez manuellement</span></div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-gov-label">Code postal <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  {...register('zipCode')}
                  maxLength={5}
                  className={cn('form-gov-input', errors.zipCode && 'form-gov-error')}
                  placeholder="75001"
                />
                {errors.zipCode && <p className="form-gov-error-msg">{errors.zipCode.message as string}</p>}
              </div>
              <div>
                <label className="form-gov-label">Commune <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  {...register('city')}
                  className={cn('form-gov-input', errors.city && 'form-gov-error')}
                  placeholder="Paris"
                />
                {errors.city && <p className="form-gov-error-msg">{errors.city.message as string}</p>}
              </div>
            </div>
            <div>
              <label className="form-gov-label">Adresse precise <span className="text-gray-400 font-normal">(optionnel)</span></label>
              <input
                type="text"
                {...register('adresse')}
                className="form-gov-input"
                placeholder="Ex: 12 rue de la Mairie, devant le n°24..."
              />
            </div>
          </div>
        );
      }

      case 'description':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Decrivez le probleme</h2>
              <p className="form-gov-hint">Plus votre description est precise, plus votre signalement sera traite efficacement.</p>
            </div>
            <div>
              <label className="form-gov-label">Description <span className="text-red-600">*</span></label>
              <textarea
                {...register('description')}
                rows={5}
                className={cn('form-gov-input', errors.description && 'form-gov-error')}
                placeholder="Decrivez le probleme de maniere precise : quoi, ou exactement, depuis quand, niveau de gravite..."
              />
              <p className="text-xs text-gray-400 mt-1">
                {(watchDescription || '').length}/10 caracteres minimum
              </p>
              {errors.description && <p className="form-gov-error-msg">{errors.description.message as string}</p>}
            </div>

            {/* Upload photos */}
            <div>
              <label className="form-gov-label">Photos / pieces jointes <span className="text-gray-400 font-normal">(optionnel, max {MAX_FILES})</span></label>
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
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Vos coordonnees</h2>
              <p className="form-gov-hint">Ces informations nous permettent de vous tenir informe du suivi de votre signalement.</p>
              {!isAuthenticated && (
                <Alert variant="default" className="mt-3">
                  Un compte gratuit sera cree avec votre email pour suivre votre signalement.
                </Alert>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-gov-label">Nom <span className="text-red-600">*</span></label>
                <input type="text" {...register('requesterLastName')} className={cn('form-gov-input', errors.requesterLastName && 'form-gov-error')} />
                {errors.requesterLastName && <p className="form-gov-error-msg">{errors.requesterLastName.message as string}</p>}
              </div>
              <div>
                <label className="form-gov-label">Prenom <span className="text-red-600">*</span></label>
                <input type="text" {...register('requesterFirstName')} className={cn('form-gov-input', errors.requesterFirstName && 'form-gov-error')} />
                {errors.requesterFirstName && <p className="form-gov-error-msg">{errors.requesterFirstName.message as string}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-gov-label">Email <span className="text-red-600">*</span></label>
                <input type="email" {...register('email')} className={cn('form-gov-input', errors.email && 'form-gov-error')} placeholder="votre@email.fr" />
                {errors.email && <p className="form-gov-error-msg">{errors.email.message as string}</p>}
              </div>
              <div>
                <label className="form-gov-label">Confirmer l&apos;email <span className="text-red-600">*</span></label>
                <input type="email" {...register('emailConfirm')} className={cn('form-gov-input', errors.emailConfirm && 'form-gov-error')} placeholder="votre@email.fr" />
                {errors.emailConfirm && <p className="form-gov-error-msg">{errors.emailConfirm.message as string}</p>}
              </div>
            </div>
            <div>
              <label className="form-gov-label">Telephone <span className="text-gray-400 font-normal">(optionnel)</span></label>
              <input type="tel" {...register('telephone')} className={cn('form-gov-input', errors.telephone && 'form-gov-error')} placeholder="06 12 34 56 78" />
              {errors.telephone && <p className="form-gov-error-msg">{errors.telephone.message as string}</p>}
            </div>
          </div>
        );

      case 'summary': {
        const values = methods.getValues();
        const selectedCat = SIGNALEMENT_CATEGORIES.find(c => c.value === values.category);

        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Recapitulatif de votre signalement</h2>
              <p className="form-gov-hint">Verifiez les informations avant de valider. Ce service est entierement gratuit.</p>
            </div>

            {/* Recap */}
            <div className="bg-gray-50 rounded-lg p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedCat?.icon}</span>
                <div>
                  <p className="font-medium text-gray-900">{selectedCat?.label}</p>
                  <p className="text-sm text-gray-500">{values.city} ({values.zipCode})</p>
                </div>
              </div>

              {values.adresse && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Adresse</p>
                  <p className="text-sm text-gray-700">{values.adresse}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{values.description}</p>
              </div>

              {selectedFiles.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pieces jointes</p>
                  <p className="text-sm text-gray-700">{selectedFiles.length} fichier(s)</p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</p>
                <p className="text-sm text-gray-700">{values.requesterFirstName} {values.requesterLastName}</p>
                <p className="text-sm text-gray-500">{values.email}</p>
                {values.telephone && <p className="text-sm text-gray-500">{values.telephone}</p>}
              </div>

              {/* Badge gratuit */}
              <div className="pt-3 border-t flex justify-between items-center">
                <span className="font-medium text-gray-900">Cout</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                  Gratuit
                </span>
              </div>
            </div>

            {/* Consentements */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('consents.acceptTerms')}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  J&apos;accepte les{' '}
                  <a href="/conditions-generales" target="_blank" className="text-blue-600 underline">
                    conditions generales d&apos;utilisation
                  </a>
                </span>
              </label>
              {errors.consents?.acceptTerms && (
                <p className="form-gov-error-msg ml-7">{errors.consents.acceptTerms.message as string}</p>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('consents.acceptDataProcessing')}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  J&apos;accepte le traitement de mes donnees personnelles pour le suivi de mon signalement
                </span>
              </label>
              {errors.consents?.acceptDataProcessing && (
                <p className="form-gov-error-msg ml-7">{errors.consents.acceptDataProcessing.message as string}</p>
              )}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => index < currentStep && setCurrentStep(index)}
                    disabled={index > currentStep}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                      index < currentStep
                        ? 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'
                        : index === currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    )}
                  >
                    {index < currentStep ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </button>
                  <span className={cn(
                    'mt-2 text-xs font-medium hidden sm:block',
                    index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-2',
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Contenu de l'etape */}
        <Card>
          <CardContent className="pt-6">
            {error && (
              <Alert variant="error" className="mb-6">
                {error}
              </Alert>
            )}
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Precedent
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext}>
              Suivant
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                // Auto-accepter les consentements si aucun coche
                const consents = methods.getValues('consents');
                if (!consents.acceptTerms && !consents.acceptDataProcessing) {
                  const val = true as unknown as true;
                  setValue('consents.acceptTerms', val, { shouldValidate: true });
                  setValue('consents.acceptDataProcessing', val, { shouldValidate: true });
                }
                methods.handleSubmit(handleFormSubmit, (validationErrors) => {
                  const messages: string[] = [];
                  const flatErrors = (obj: Record<string, unknown>): void => {
                    for (const [, val] of Object.entries(obj)) {
                      if (val && typeof val === 'object' && 'message' in val && typeof (val as { message: unknown }).message === 'string') {
                        messages.push((val as { message: string }).message);
                      } else if (val && typeof val === 'object') {
                        flatErrors(val as Record<string, unknown>);
                      }
                    }
                  };
                  flatErrors(validationErrors as Record<string, unknown>);
                  if (messages.length > 0) {
                    setError('Veuillez corriger les erreurs : ' + messages.join(', '));
                  }
                })();
              }}
            >
              {isSubmitting ? 'Envoi en cours...' : 'Tout accepter et envoyer mon signalement'}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

export default SignalementMairieForm;
