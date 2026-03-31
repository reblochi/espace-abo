// Page Coffre-fort numérique — à venir

'use client';

import { Card, CardContent } from '@/components/ui';

export default function CoffrefortPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Coffre-fort numérique</h1>
        <p className="text-gray-500 mt-1">
          Stockez et organisez vos documents importants en toute sécurité
        </p>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <div className="p-4 bg-blue-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Bientôt disponible</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Le coffre-fort numérique vous permettra de stocker vos documents importants
            (carte d&apos;identité, actes, justificatifs...) en toute sécurité, avec des alertes
            d&apos;expiration automatiques.
          </p>
          <p className="text-sm text-blue-600 font-medium mt-4">
            Disponible en juin 2026
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
