// Composant de selection de type de demarche

'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PROCESS_TYPES_CONFIG,
  PROCESS_CATEGORIES,
  getProcessTypesByCategory,
  getProcessTypeSlug,
  formatPrice,
  type ProcessCategory,
  type ProcessTypeConfig,
} from '@/lib/process-types';

interface ProcessTypeSelectorProps {
  onSelect?: (type: string) => void;
  isSubscriber?: boolean;
  showPrices?: boolean;
  filterCategory?: ProcessCategory;
  className?: string;
}

// Icones SVG simplifiees
const Icons: Record<string, React.FC<{ className?: string }>> = {
  car: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  ),
  'file-text': ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  user: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  building: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  home: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  scale: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  ),
  baby: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  heart: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  'id-card': ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
    </svg>
  ),
  plane: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  'credit-card': ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  leaf: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  'shield-check': ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  map: ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
};

function ProcessIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = Icons[icon] || Icons['file-text'];
  return <Icon className={className} />;
}

function CategoryIcon({ category }: { category: ProcessCategory }) {
  const iconName = PROCESS_CATEGORIES[category].icon;
  const Icon = Icons[iconName] || Icons['file-text'];
  return <Icon className="h-5 w-5" />;
}

function ProcessTypeCard({
  config,
  isSubscriber,
  showPrices,
  onSelect,
}: {
  config: ProcessTypeConfig;
  isSubscriber?: boolean;
  showPrices?: boolean;
  onSelect?: (type: string) => void;
}) {
  const slug = getProcessTypeSlug(config.code);
  const price = isSubscriber && config.includedInSubscription
    ? 'Inclus'
    : formatPrice(config.basePrice);

  const content = (
    <Card
      className={cn(
        'group cursor-pointer transition-all hover:shadow-md hover:border-blue-300',
        onSelect && 'hover:bg-blue-50/50'
      )}
      onClick={() => onSelect?.(config.code)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
            <ProcessIcon icon={config.icon} className="h-6 w-6" />
          </div>
          {config.hasTaxes && (
            <Badge variant="outline" className="text-xs">
              + taxes
            </Badge>
          )}
        </div>
        <CardTitle className="text-base mt-3">{config.label}</CardTitle>
        <CardDescription className="text-sm line-clamp-2">
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{config.estimatedDelay}</span>
          {showPrices && (
            <span className={cn(
              'font-medium',
              isSubscriber && config.includedInSubscription
                ? 'text-green-600'
                : 'text-gray-900'
            )}>
              {price}
            </span>
          )}
        </div>
        {isSubscriber && config.includedInSubscription && (
          <Badge className="mt-2 bg-green-100 text-green-800 hover:bg-green-100">
            Inclus dans votre abonnement
          </Badge>
        )}
      </CardContent>
    </Card>
  );

  if (onSelect) {
    return content;
  }

  return (
    <Link href={`/nouvelle-demarche/${slug}`}>
      {content}
    </Link>
  );
}

export function ProcessTypeSelector({
  onSelect,
  isSubscriber = false,
  showPrices = true,
  filterCategory,
  className,
}: ProcessTypeSelectorProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<ProcessCategory | 'all'>(
    filterCategory || 'all'
  );

  const categories = Object.entries(PROCESS_CATEGORIES) as [ProcessCategory, { label: string; icon: string }][];

  const filteredTypes = React.useMemo(() => {
    if (filterCategory) {
      return getProcessTypesByCategory(filterCategory);
    }
    if (selectedCategory === 'all') {
      return Object.values(PROCESS_TYPES_CONFIG);
    }
    return getProcessTypesByCategory(selectedCategory);
  }, [selectedCategory, filterCategory]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Filtres par categorie */}
      {!filterCategory && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Toutes les demarches
          </button>
          {categories.map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors inline-flex items-center gap-2',
                selectedCategory === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <CategoryIcon category={key} />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Grille des types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTypes.map((config) => (
          <ProcessTypeCard
            key={config.code}
            config={config}
            isSubscriber={isSubscriber}
            showPrices={showPrices}
            onSelect={onSelect}
          />
        ))}
      </div>

      {filteredTypes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucune démarche disponible dans cette categorie
        </div>
      )}
    </div>
  );
}

export default ProcessTypeSelector;
