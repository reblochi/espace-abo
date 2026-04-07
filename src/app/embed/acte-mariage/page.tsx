// Page embed pour le formulaire acte de mariage
// Utilisee dans le widget JS pour integration sur sites partenaires

import { Suspense } from 'react';
import { EmbedMarriageForm } from './EmbedMarriageForm';

export default function EmbedActeMariagePage() {
  return (
    <div className="bg-white p-4 sm:p-6">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }>
        <EmbedMarriageForm />
      </Suspense>
    </div>
  );
}
