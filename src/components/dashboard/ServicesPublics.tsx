// Composant affichant les services publics proches du client

'use client';

import { useServicesPublics } from '@/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import type { ServicePublic } from '@/app/api/services-publics/route';

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  mairie: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v.01M12 14v.01M16 14v.01M8 18v.01M12 18v.01M16 18v.01" />
    </svg>
  ),
  france_services: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  caf: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  cpam: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
    </svg>
  ),
  point_accueil_numerique: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
};

const SERVICE_COLORS: Record<string, string> = {
  mairie: 'bg-blue-100 text-blue-600',
  france_services: 'bg-indigo-100 text-indigo-600',
  caf: 'bg-orange-100 text-orange-600',
  cpam: 'bg-green-100 text-green-600',
  point_accueil_numerique: 'bg-violet-100 text-violet-600',
};

function formatHoraires(horaires: ServicePublic['horaires']): string | null {
  if (!horaires || horaires.length === 0) return null;

  return horaires
    .map((h) => {
      const jour =
        h.jourDebut === h.jourFin ? h.jourDebut : `${h.jourDebut} - ${h.jourFin}`;
      const h1 = `${h.heureDebut1.slice(0, 5)}-${h.heureFin1.slice(0, 5)}`;
      const h2 =
        h.heureDebut2 && h.heureFin2
          ? ` / ${h.heureDebut2.slice(0, 5)}-${h.heureFin2.slice(0, 5)}`
          : '';
      return `${jour}: ${h1}${h2}`;
    })
    .join('\n');
}

function ServiceCard({ service }: { service: ServicePublic }) {
  const colorClass = SERVICE_COLORS[service.type] || 'bg-gray-100 text-gray-600';
  const icon = SERVICE_ICONS[service.type];
  const horairesText = formatHoraires(service.horaires);

  return (
    <div className="p-5 border rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg shrink-0 ${colorClass}`}>{icon}</div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            {service.typeLabel}
          </p>
        </div>
        {(service.urlServicePublic || service.siteInternet) && (
          <a
            href={service.urlServicePublic || service.siteInternet || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-gray-400 hover:text-blue-600 transition-colors"
            title="Voir la fiche"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      <p className="font-semibold text-gray-900 text-sm leading-snug">{service.nom}</p>
      <p className="text-sm text-gray-500 mt-1.5">
        {service.adresse}
        {service.codePostal && `, ${service.codePostal} ${service.commune}`}
      </p>

      {service.telephone && (
        <a
          href={`tel:${service.telephone.replace(/\s/g, '')}`}
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline mt-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {service.telephone}
        </a>
      )}

      {horairesText && (
        <details className="mt-2.5">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
            Horaires d&apos;ouverture
          </summary>
          <pre className="text-xs text-gray-500 mt-1 whitespace-pre-wrap font-sans">
            {horairesText}
          </pre>
        </details>
      )}
    </div>
  );
}

export function ServicesPublics() {
  const { data, isLoading, error } = useServicesPublics();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vos services publics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.services?.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Vos services publics</CardTitle>
          <span className="text-xs text-gray-400">{data.codePostal}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
