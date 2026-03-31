// Page Services — services publics, carburants, La Poste + nous contacter

'use client';

import { ServicesPublics, CarburantsPrix, LaPoste } from '@/components/dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <p className="text-gray-500 mt-1">
          Services publics, prix des carburants et bureaux de poste près de chez vous
        </p>
      </div>

      {/* Services publics + Carburants */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ServicesPublics />
        <CarburantsPrix />
      </div>

      {/* La Poste */}
      <LaPoste />

      {/* Nous contacter */}
      <Card>
        <CardHeader>
          <CardTitle>Nous contacter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <a href="mailto:contact@franceguichet.fr" className="text-sm text-blue-600 hover:text-blue-800">
                  contact@franceguichet.fr
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Téléphone</p>
                <p className="text-sm text-gray-600">Du lundi au vendredi, 9h-18h</p>
                <a href="tel:+33123456789" className="text-sm text-blue-600 hover:text-blue-800">
                  01 23 45 67 89
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Délai de réponse</p>
                <p className="text-sm text-gray-600">Nous répondons sous 24h ouvrées</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
