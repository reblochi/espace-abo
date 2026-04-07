// Page embed pour le formulaire acte de naissance
// Utilisee dans le widget JS pour integration sur sites partenaires

import { Suspense } from 'react';
import { EmbedBirthForm } from './EmbedBirthForm';

export default function EmbedActeNaissancePage() {
  return (
    <div className="bg-white p-4 sm:p-6">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }>
        <EmbedBirthForm />
      </Suspense>
    </div>
  );
}
