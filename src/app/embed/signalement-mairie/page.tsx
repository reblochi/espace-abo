// Page embed pour le formulaire signalement mairie
// Utilisee dans le widget JS pour integration sur sites partenaires (annuaire-mairie, etc.)

import { Suspense } from 'react';
import { EmbedSignalementForm } from './EmbedSignalementForm';

export const metadata = {
  title: 'Signaler un probleme a la mairie',
  robots: 'noindex, nofollow',
};

export default function EmbedSignalementMairiePage() {
  return (
    <div className="bg-white p-4 sm:p-6">
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }>
        <EmbedSignalementForm />
      </Suspense>
    </div>
  );
}
