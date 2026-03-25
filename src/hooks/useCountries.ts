// Hook pour charger la liste des pays depuis l'API
// Cache cote client pour eviter les appels repetes

'use client';

import { useState, useEffect } from 'react';

export interface CountryOption {
  id: number;
  label: string;
}

const FRANCE_OPTION: CountryOption = { id: 0, label: 'France ou DOM-TOM' };

// Cache module-level (persiste entre les renders/remounts)
let cachedCountries: CountryOption[] | null = null;

export function useCountries() {
  const [countries, setCountries] = useState<CountryOption[]>(cachedCountries || []);
  const [isLoading, setIsLoading] = useState(!cachedCountries);

  useEffect(() => {
    if (cachedCountries) return;

    fetch('/api/countries')
      .then((res) => res.json())
      .then((data: CountryOption[]) => {
        cachedCountries = data;
        setCountries(data);
      })
      .catch(() => {
        // Silently fail - components will show empty select
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Liste avec France en premier
  const countriesWithFrance = [FRANCE_OPTION, ...countries];

  return { countries, countriesWithFrance, isLoading };
}
