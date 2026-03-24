// Composant affichant les bureaux de poste et boites aux lettres

'use client';

import { useState } from 'react';
import { useLaPoste } from '@/hooks/useLaPoste';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import type { BureauPoste, BoiteAuxLettres } from '@/app/api/la-poste/route';

function BureauCard({ bureau }: { bureau: BureauPoste }) {
  return (
    <div className="p-4 border rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg shrink-0 bg-yellow-100 text-yellow-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 text-sm">{bureau.nom}</p>
          <p className="text-xs text-gray-400 uppercase">{bureau.type}</p>
          <p className="text-sm text-gray-500 mt-1">
            {bureau.adresse}, {bureau.codePostal} {bureau.ville}
          </p>
          <div className="flex items-center gap-3 mt-2">
            {bureau.telephone && (
              <a
                href={`tel:${bureau.telephone.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {bureau.telephone}
              </a>
            )}
            {bureau.distributeurBillets && (
              <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                DAB
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BoiteCard({ boite }: { boite: BoiteAuxLettres }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="min-w-0 flex-1 mr-2">
        <p className="text-sm text-gray-900">
          {boite.adresse}, {boite.codePostal} {boite.ville}
        </p>
      </div>
      <div className="text-right shrink-0 text-xs text-gray-500">
        {boite.releveSemaine && <p>Sem. {boite.releveSemaine}</p>}
        {boite.releveSamedi && <p>Sam. {boite.releveSamedi}</p>}
      </div>
    </div>
  );
}

export function LaPoste() {
  const { data, isLoading, error } = useLaPoste();
  const [showBoites, setShowBoites] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>La Poste</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || (!data?.bureaux?.length && !data?.boites?.length)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>La Poste</CardTitle>
          <span className="text-xs text-gray-400">{data.codePostal}</span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Bureaux de poste */}
        {data.bureaux.length > 0 && (
          <div className="space-y-3">
            {data.bureaux.map((bureau) => (
              <BureauCard key={bureau.id} bureau={bureau} />
            ))}
          </div>
        )}

        {/* Boites aux lettres */}
        {data.boites.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowBoites(!showBoites)}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors w-full"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showBoites ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Boites aux lettres ({data.boites.length})
            </button>

            {showBoites && (
              <div className="space-y-2 mt-3">
                {data.boites.map((boite) => (
                  <BoiteCard key={boite.id} boite={boite} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
