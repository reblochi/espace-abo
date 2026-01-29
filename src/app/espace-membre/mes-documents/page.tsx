// Page Mes Documents

'use client';

import { DocumentList } from '@/components/documents';

export default function MesDocumentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes documents</h1>
        <p className="text-gray-500 mt-1">
          Retrouvez tous les documents generes lors de vos demarches
        </p>
      </div>

      {/* Liste des documents */}
      <DocumentList />
    </div>
  );
}
