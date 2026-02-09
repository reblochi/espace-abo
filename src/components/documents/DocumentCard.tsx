// Composant Card Document

'use client';

import { Card, CardContent, Button } from '@/components/ui';
import { formatDate, formatFileSize } from '@/lib/utils';
import type { ProcessFile, Document } from '@/types';

interface Props {
  document: ProcessFile | Document;
}

const typeLabels: Record<string, string> = {
  // Types generaux
  CERFA: 'Cerfa',
  GENERATED_DOC: 'Document genere',
  PROOF: 'Justificatif',
  ATTACHMENT: 'Piece jointe',
  RESULT: 'Resultat',
  // Types d'identite
  CNI: 'Carte d\'identite',
  PASSEPORT: 'Passeport',
  PERMIS: 'Permis de conduire',
  PHOTO_IDENTITE: 'Photo d\'identite',
  // Types vehicule
  CARTE_GRISE: 'Carte grise',
  CERTIFICAT_CESSION: 'Certificat de cession',
  CERTIFICAT_NON_GAGE: 'Certificat de non-gage',
  CONTROLE_TECHNIQUE: 'Controle technique',
  // Autres
  JUSTIFICATIF_DOMICILE: 'Justificatif de domicile',
  ACTE_NAISSANCE: 'Acte de naissance',
  LIVRET_FAMILLE: 'Livret de famille',
  MANDAT: 'Mandat',
  DECLARATION_PERTE: 'Declaration de perte/vol',
  AUTRE: 'Autre document',
};

const typeIcons: Record<string, React.ReactNode> = {
  CERFA: (
    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  GENERATED_DOC: (
    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  PROOF: (
    <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  ATTACHMENT: (
    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  ),
  RESULT: (
    <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
};

export function DocumentCard({ document }: Props) {
  const handleDownload = async () => {
    window.open(`/api/documents/${document.id}/download`, '_blank');
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {typeIcons[document.fileType] || typeIcons.ATTACHMENT}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">
              {document.originalName}
            </p>
            <p className="text-sm text-gray-500">
              {typeLabels[document.fileType] || document.fileType}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
              <span>{formatFileSize(document.size)}</span>
              <span>•</span>
              <span>{formatDate(document.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleDownload}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Telecharger
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
