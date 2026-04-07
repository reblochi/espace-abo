// Autocomplete code postal / ville via API vicopo (geo.api.gouv.fr)
// Le client tape un CP ou un nom de ville → suggestions en dropdown
// Les champs restent editables manuellement pour ne pas bloquer la vente

'use client';

import { useState, useEffect, useRef } from 'react';

interface VicopoCity {
  code: string;
  city: string;
}

interface VicopoResponse {
  input: string;
  cities: VicopoCity[];
}

export interface PostalCityAutocompleteProps {
  cpValue: string;
  cityValue: string;
  onCpChange: (value: string) => void;
  onCityChange: (value: string) => void;
  cpError?: string;
  cityError?: string;
  required?: boolean;
  variant?: 'gov' | 'default';
}

const VICOPO_URL = '/api/vicopo';

export function PostalCityAutocomplete({
  cpValue,
  cityValue,
  onCpChange,
  onCityChange,
  cpError,
  cityError,
  required = false,
  variant = 'gov',
}: PostalCityAutocompleteProps) {
  const isGov = variant === 'gov';
  const labelClass = isGov ? 'form-gov-label' : 'block text-sm font-medium text-gray-700 mb-1';
  const inputClass = isGov ? 'form-gov-input' : 'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const errorInputClass = isGov ? 'form-gov-error' : 'border-red-500 focus:ring-red-500';
  const errorMsgClass = isGov ? 'form-gov-error-msg' : 'mt-1 text-sm text-red-500';
  const dropdownClass = isGov ? 'border-2 border-gray-900' : 'border border-gray-300 rounded-md';
  const [suggestions, setSuggestions] = useState<VicopoCity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeField, setActiveField] = useState<'cp' | 'city' | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fermer la liste quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveField(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche avec debounce
  const search = (value: string, field: 'cp' | 'city') => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value || value.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const param = /^\d+$/.test(value) ? 'code' : 'city';
        const response = await fetch(`${VICOPO_URL}?${param}=${encodeURIComponent(value)}`);
        if (response.ok) {
          const text = await response.text();
          if (text && text.trim()) {
            const data: VicopoResponse = JSON.parse(text);
            setSuggestions(data.cities || []);
            setIsOpen((data.cities || []).length > 0);
          } else {
            setSuggestions([]);
            setIsOpen(false);
          }
        }
      } catch {
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSelect = (item: VicopoCity) => {
    onCpChange(String(item.code));
    onCityChange(item.city);
    setSuggestions([]);
    setIsOpen(false);
    setActiveField(null);
  };

  const handleCpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onCpChange(value);
    setActiveField('cp');
    search(value, 'cp');
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onCityChange(value);
    setActiveField('city');
    search(value, 'city');
  };

  return (
    <div ref={wrapperRef} className="grid grid-cols-3 gap-4">
      {/* Code Postal */}
      <div className="relative">
        <label className={labelClass}>
          Code postal {required && <span className="text-red-600">*</span>}
        </label>
        <input
          type="text"
          value={cpValue}
          onChange={handleCpChange}
          onFocus={() => {
            setActiveField('cp');
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder="Ex: 75001"
          maxLength={5}
          autoComplete="off"
          className={`${inputClass} ${cpError ? errorInputClass : ''}`}
        />
        {cpError && <p className={errorMsgClass}>{cpError}</p>}

        {/* Suggestions sous le champ CP */}
        {isOpen && activeField === 'cp' && suggestions.length > 0 && (
          <ul className={`absolute z-50 w-[calc(100%+200%+1rem)] mt-1 bg-white shadow-lg max-h-60 overflow-auto ${dropdownClass}`}>
            {suggestions.map((item, index) => (
              <li
                key={`${item.code}-${index}`}
                onClick={() => handleSelect(item)}
                className="px-3 py-2.5 cursor-pointer hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
              >
                <strong>{item.code}</strong> — {item.city}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Ville */}
      <div className="col-span-2 relative">
        <label className={labelClass}>
          Ville {required && <span className="text-red-600">*</span>}
        </label>
        <div className="relative">
          <input
            type="text"
            value={cityValue}
            onChange={handleCityChange}
            onFocus={() => {
              setActiveField('city');
              if (suggestions.length > 0) setIsOpen(true);
            }}
            placeholder="Ex: Paris"
            maxLength={45}
            autoComplete="off"
            className={`${inputClass} ${cityError ? errorInputClass : ''}`}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        {cityError && <p className={errorMsgClass}>{cityError}</p>}

        {/* Suggestions sous le champ Ville */}
        {isOpen && activeField === 'city' && suggestions.length > 0 && (
          <ul className={`absolute z-50 w-full mt-1 bg-white shadow-lg max-h-60 overflow-auto ${dropdownClass}`}>
            {suggestions.map((item, index) => (
              <li
                key={`${item.code}-${index}`}
                onClick={() => handleSelect(item)}
                className="px-3 py-2.5 cursor-pointer hover:bg-blue-50 text-sm border-b border-gray-100 last:border-b-0"
              >
                <strong>{item.code}</strong> — {item.city}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
