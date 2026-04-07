// Composant Autocomplete pour recherche de communes

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface City {
  id: number;
  name: string;
  postal_code: string;
  department_code: string;
}

export interface CityAutocompleteProps {
  label?: string;
  placeholder?: string;
  value?: City | null;
  onChange: (city: City | null) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: 'gov' | 'default';
}

export function CityAutocomplete({
  label,
  placeholder = 'Rechercher une commune...',
  value,
  onChange,
  error,
  required,
  disabled,
  className,
  variant = 'gov',
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const formatCity = (city: City) =>
    city.postal_code ? `${city.name} (${city.postal_code})` : city.name;

  // Synchroniser l'input avec la valeur selectionnee
  useEffect(() => {
    if (value) {
      setInputValue(formatCity(value));
    } else {
      setInputValue('');
    }
  }, [value]);

  // Fermer les suggestions si clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche avec debounce
  const searchCities = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/cities/search?q=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const cities = await response.json();
        setSuggestions(cities);
        setIsOpen(cities.length > 0);
        setHighlightedIndex(-1);
      }
    } catch (error) {
      console.error('Erreur recherche communes:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Si l'utilisateur efface, annuler la selection
    if (!newValue && value) {
      onChange(null);
    }

    // Debounce la recherche
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchCities(newValue);
    }, 300);
  };

  const handleSelect = (city: City) => {
    onChange(city);
    setInputValue(formatCity(city));
    setIsOpen(false);
    setSuggestions([]);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  // Auto-selectionner le premier résultat quand on quitte le champ sans avoir clique
  const handleBlur = () => {
    // Petit delai pour laisser le temps au click sur une suggestion de se declencher
    setTimeout(() => {
      if (suggestions.length > 0 && !value) {
        // Aucune selection explicite → prendre le premier résultat
        onChange(suggestions[0]);
        setInputValue(formatCity(suggestions[0]));
      } else if (suggestions.length > 0 && value && inputValue !== formatCity(value)) {
        // L'utilisateur a modifie le texte apres une selection → re-selectionner le premier
        onChange(suggestions[0]);
        setInputValue(formatCity(suggestions[0]));
      }
      setIsOpen(false);
    }, 200);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label className={variant === 'gov' ? 'form-gov-label' : 'block text-sm font-medium text-gray-700 mb-1'}>
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            variant === 'gov'
              ? 'form-gov-input pr-10'
              : 'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10',
            disabled && 'opacity-50 cursor-not-allowed',
            variant === 'gov' && error && 'form-gov-error',
            variant !== 'gov' && error && 'border-red-500 focus:ring-red-500'
          )}
        />

        {/* Icone de recherche ou spinner */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              className="h-5 w-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
      </div>

      {error && <p className={variant === 'gov' ? 'form-gov-error-msg' : 'mt-1 text-sm text-red-500'}>{error}</p>}

      {/* Liste des suggestions */}
      {isOpen && suggestions.length > 0 && (
        <ul
          className={cn(
            'absolute z-50 w-full mt-1 bg-white shadow-lg max-h-60 overflow-auto',
            variant === 'gov' ? 'border-2 border-gray-900' : 'border border-gray-300 rounded-md'
          )}
          role="listbox"
        >
          {suggestions.map((city, index) => (
            <li
              key={city.id}
              onClick={() => handleSelect(city)}
              onMouseEnter={() => setHighlightedIndex(index)}
              role="option"
              aria-selected={highlightedIndex === index}
              className={cn(
                'px-3 py-2.5 cursor-pointer text-base border-b border-gray-100 last:border-b-0',
                highlightedIndex === index
                  ? 'bg-blue-50 text-blue-900'
                  : 'hover:bg-gray-50'
              )}
            >
              <span className="font-medium">{city.name}</span>
              <span className="text-gray-500 ml-2">
                ({city.postal_code}) - {city.department_code}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Message "aucun résultat" */}
      {isOpen && !isLoading && suggestions.length === 0 && inputValue.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-900 shadow-lg p-3 text-base text-gray-500">
          Aucune commune trouvee
        </div>
      )}
    </div>
  );
}
