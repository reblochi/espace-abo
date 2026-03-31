// Etape 5: Upload des documents

'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { REGISTRATION_CERTIFICATE_DOCUMENTS, type DocumentRequirement } from '@/lib/process-types';
import { OperationType } from '@/types/registration-certificate';
import type { RegistrationCertificateInput } from '@/schemas/registration-certificate';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  status: 'uploading' | 'uploaded' | 'error';
  error?: string;
}

interface StepDocumentsProps {
  processRéférence?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

export function StepDocuments({ processRéférence }: StepDocumentsProps) {
  const { watch } = useFormContext<RegistrationCertificateInput>();
  const [uploadedFiles, setUploadedFiles] = React.useState<Record<string, UploadedFile[]>>({});
  const [error, setError] = React.useState<string | null>(null);

  const operationType = watch('operation.typeId');

  // Filtrer les documents requis selon le type d'operation
  const requiredDocuments = React.useMemo(() => {
    return REGISTRATION_CERTIFICATE_DOCUMENTS.filter(doc => {
      if (!doc.conditionalOn) return true;

      const opTypeCondition = doc.conditionalOn['operation.typeId'];
      if (opTypeCondition) {
        return opTypeCondition.includes(String(operationType));
      }
      return true;
    });
  }, [operationType]);

  const handleFileUpload = async (docId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const docConfig = requiredDocuments.find(d => d.id === docId);

    // Validation
    if (!docConfig) return;

    // Verifier le format
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!docConfig.acceptedFormats.includes(extension || '')) {
      setError(`Format non accepte. Formats autorises: ${docConfig.acceptedFormats.join(', ')}`);
      return;
    }

    // Verifier la taille
    const maxSize = docConfig.maxSizeMb * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Fichier trop volumineux. Taille maximum: ${docConfig.maxSizeMb} Mo`);
      return;
    }

    setError(null);

    // Ajouter le fichier en mode uploading
    const tempId = `temp-${Date.now()}`;
    setUploadedFiles(prev => ({
      ...prev,
      [docId]: [
        ...(prev[docId] || []),
        {
          id: tempId,
          name: file.name,
          type: file.type,
          size: file.size,
          status: 'uploading',
        },
      ],
    }));

    // Upload vers l'API
    if (processRéférence) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', docId);

        const response = await fetch(`/api/processes/${processRéférence}/files`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de l\'upload');
        }

        const uploadedFile = await response.json();

        // Mettre à jour avec l'ID reel
        setUploadedFiles(prev => ({
          ...prev,
          [docId]: prev[docId].map(f =>
            f.id === tempId
              ? { ...f, id: uploadedFile.id, status: 'uploaded' }
              : f
          ),
        }));
      } catch (err) {
        setUploadedFiles(prev => ({
          ...prev,
          [docId]: prev[docId].map(f =>
            f.id === tempId
              ? { ...f, status: 'error', error: err instanceof Error ? err.message : 'Erreur' }
              : f
          ),
        }));
      }
    } else {
      // Pas de reference, juste simuler l'upload pour preview
      setTimeout(() => {
        setUploadedFiles(prev => ({
          ...prev,
          [docId]: prev[docId].map(f =>
            f.id === tempId
              ? { ...f, status: 'uploaded' }
              : f
          ),
        }));
      }, 1000);
    }
  };

  const handleRemoveFile = async (docId: string, fileId: string) => {
    // TODO: Appel API pour supprimer le fichier si necessaire
    setUploadedFiles(prev => ({
      ...prev,
      [docId]: prev[docId].filter(f => f.id !== fileId),
    }));
  };

  const isDocumentUploaded = (docId: string): boolean => {
    const files = uploadedFiles[docId];
    return files && files.some(f => f.status === 'uploaded');
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}

      <p className="text-sm text-gray-600">
        Veuillez fournir les documents suivants. Les fichiers acceptes sont: PDF, JPG, PNG (max 10 Mo).
      </p>

      <div className="space-y-4">
        {requiredDocuments.map((doc) => (
          <DocumentUploadCard
            key={doc.id}
            document={doc}
            uploadedFiles={uploadedFiles[doc.id] || []}
            onUpload={(files) => handleFileUpload(doc.id, files)}
            onRemove={(fileId) => handleRemoveFile(doc.id, fileId)}
            isUploaded={isDocumentUploaded(doc.id)}
          />
        ))}
      </div>

      {/* Aide */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Conseils pour vos documents</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Assurez-vous que les documents sont lisibles et non floques</li>
          <li>• L'ancienne carte grise doit etre barree avec la mention "Vendu le" et signee</li>
          <li>• Le justificatif de domicile doit dater de moins de 6 mois</li>
          <li>• Le controle technique doit etre valide pour les vehicules de plus de 4 ans</li>
        </ul>
      </div>
    </div>
  );
}

interface DocumentUploadCardProps {
  document: DocumentRequirement;
  uploadedFiles: UploadedFile[];
  onUpload: (files: FileList | null) => void;
  onRemove: (fileId: string) => void;
  isUploaded: boolean;
}

function DocumentUploadCard({
  document,
  uploadedFiles,
  onUpload,
  onRemove,
  isUploaded,
}: DocumentUploadCardProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className={cn(
      'p-4 rounded-lg border-2 transition-colors',
      isUploaded ? 'border-green-200 bg-green-50' : 'border-gray-200'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900">{document.label}</h4>
            {document.required && (
              <span className="text-xs text-red-600 font-medium">Obligatoire</span>
            )}
            {isUploaded && (
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">{document.description}</p>
          <p className="text-xs text-gray-400 mt-1">
            Formats: {document.acceptedFormats.join(', ').toUpperCase()} - Max {document.maxSizeMb} Mo
          </p>
        </div>

        <div>
          <input
            ref={inputRef}
            type="file"
            accept={document.acceptedFormats.map(f => `.${f}`).join(',')}
            onChange={(e) => onUpload(e.target.files)}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {uploadedFiles.length > 0 ? 'Remplacer' : 'Ajouter'}
          </Button>
        </div>
      </div>

      {/* Liste des fichiers uploades */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className={cn(
                'flex items-center justify-between p-2 rounded-lg',
                file.status === 'uploading' && 'bg-blue-50',
                file.status === 'uploaded' && 'bg-green-50',
                file.status === 'error' && 'bg-red-50'
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-sm truncate">{file.name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  ({formatFileSize(file.size)})
                </span>
              </div>

              <div className="flex items-center gap-2 ml-2">
                {file.status === 'uploading' && (
                  <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {file.status === 'uploaded' && (
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {file.status === 'error' && (
                  <span className="text-xs text-red-600">{file.error}</span>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(file.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StepDocuments;
