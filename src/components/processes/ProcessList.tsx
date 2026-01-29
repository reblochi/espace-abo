// Composant Liste des demarches

'use client';

import { useProcesses } from '@/hooks';
import { ProcessCard } from './ProcessCard';
import { Button } from '@/components/ui';

interface Props {
  initialPage?: number;
}

export function ProcessList({ initialPage = 1 }: Props) {
  const { processes, pagination, isLoading, error, refetch } = useProcesses({ page: initialPage });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Erreur lors du chargement des demarches</p>
        <Button variant="outline" onClick={() => refetch()}>
          Reessayer
        </Button>
      </div>
    );
  }

  if (processes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-5xl mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demarche</h3>
        <p className="text-gray-500">Vous n'avez pas encore effectue de demarche.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {processes.map((process) => (
          <ProcessCard key={process.id} process={process} />
        ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === pagination.page ? 'default' : 'outline'}
              size="sm"
            >
              {page}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
