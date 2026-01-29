// Composant Liste des documents

'use client';

import { useDocuments } from '@/hooks';
import { DocumentCard } from './DocumentCard';
import { Button, Spinner } from '@/components/ui';

export function DocumentList() {
  const { documents, isLoading, error, refetch } = useDocuments();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Erreur lors du chargement des documents</p>
        <Button variant="outline" onClick={() => refetch()}>
          Reessayer
        </Button>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-5xl mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun document</h3>
        <p className="text-gray-500">Vos documents apparaitront ici une fois generes.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {documents.map((document) => (
        <DocumentCard key={document.id} document={document} />
      ))}
    </div>
  );
}
