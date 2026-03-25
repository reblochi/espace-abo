// Section d'upload de documents pour une demarche
// Affiche les documents requis avec leur statut (uploade ou manquant)
// et permet l'upload fichier par fichier

'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useUploadProcessFile } from '@/hooks/useProcess';
import { DocumentCard } from './DocumentCard';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import type { FileType } from '@/types/process';
import { fileTypeLabels } from '@/types/process';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/types/document';
import type { DocumentRequirement } from '@/lib/process-types';

interface DocumentUploadSectionProps {
  reference: string;
  requiredDocuments: DocumentRequirement[];
  uploadedFiles: Array<{ id: string; fileType: string; originalName: string; [key: string]: unknown }>;
  processStatus: string;
  onAllUploaded?: () => void;
}

export function DocumentUploadSection({
  reference,
  requiredDocuments,
  uploadedFiles,
  processStatus,
  onAllUploaded,
}: DocumentUploadSectionProps) {
  const uploadMutation = useUploadProcessFile(reference);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFileType = useRef<FileType | null>(null);

  const isPendingDocuments = processStatus === 'PENDING_DOCUMENTS';
  const uploadedTypes = new Set(uploadedFiles.map(f => f.fileType));

  const allRequiredUploaded = requiredDocuments
    .filter(d => d.required)
    .every(d => uploadedTypes.has(d.id));

  const handleUploadClick = (fileType: FileType) => {
    setError(null);
    pendingFileType.current = fileType;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const fileType = pendingFileType.current;
    if (!file || !fileType) return;

    // Reset input
    e.target.value = '';

    // Validation
    if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
      setError('Format non accepte. Formats autorises : PDF, JPEG, PNG');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Fichier trop volumineux (max 5 Mo)');
      return;
    }

    setUploadingType(fileType);
    setError(null);

    try {
      await uploadMutation.mutateAsync({ file, fileType });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
    } finally {
      setUploadingType(null);
      pendingFileType.current = null;
    }
  };

  if (requiredDocuments.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Input file cache */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={ALLOWED_MIME_TYPES.join(',')}
        onChange={handleFileChange}
      />

      {error && (
        <Alert variant="error" className="mb-4">{error}</Alert>
      )}

      {/* Info PENDING_DOCUMENTS */}
      {isPendingDocuments && !allRequiredUploaded && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            Veuillez envoyer les documents requis ci-dessous pour que votre demarche soit traitee.
          </p>
        </div>
      )}

      {/* Liste des documents requis */}
      <div className="space-y-3">
        {requiredDocuments.map((doc) => {
          const uploaded = uploadedFiles.find(f => f.fileType === doc.id);
          const isUploading = uploadingType === doc.id;

          return (
            <div
              key={doc.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border',
                uploaded
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-white'
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Icone statut */}
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  uploaded ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                )}>
                  {uploaded ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  )}
                </div>

                <div className="min-w-0">
                  <p className={cn(
                    'text-sm font-medium',
                    uploaded ? 'text-green-800' : 'text-gray-900'
                  )}>
                    {fileTypeLabels[doc.id as FileType] || doc.label}
                    {doc.required && !uploaded && <span className="text-red-500 ml-1">*</span>}
                  </p>
                  {uploaded ? (
                    <p className="text-xs text-green-600 truncate">{uploaded.originalName}</p>
                  ) : (
                    <p className="text-xs text-gray-500">{doc.description}</p>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="flex-shrink-0 ml-3">
                {uploaded ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleUploadClick(doc.id as FileType)}
                    disabled={!!uploadingType}
                  >
                    Remplacer
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleUploadClick(doc.id as FileType)}
                    disabled={!!uploadingType}
                  >
                    {isUploading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Envoi...
                      </span>
                    ) : (
                      'Envoyer'
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bouton soumettre quand tout est uploade */}
      {isPendingDocuments && allRequiredUploaded && onAllUploaded && (
        <div className="pt-2">
          <Button onClick={onAllUploaded} className="w-full">
            Tous les documents sont envoyes - Soumettre ma demarche
          </Button>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Formats acceptes : PDF, JPEG, PNG. Taille max : 5 Mo par fichier.
      </p>
    </div>
  );
}
