// Composant Autocomplete pour recherche de communes

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui';
import { Spinner } from '@/components/ui';

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
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  // Synchroniser l'input avec la valeur selectionnee
  useEffect(() => {
    if (value) {
      setInputValue(`${value.name} (${value.postal_code})`);
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
    setInputValue(`${city.name} (${city.postal_code})`);
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

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
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
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm pr-10',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:ring-red-500'
          )}
        />

        {/* Icone de recherche ou spinner */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isLoading ? (
            <Spinner className="h-4 w-4 text-gray-400" />
          ) : (
            <svg
              className="h-4 w-4 text-gray-400"
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

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      {/* Liste des suggestions */}
      {isOpen && suggestions.length > 0 && (
        <ul
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
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
                'px-3 py-2 cursor-pointer text-sm',
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

      {/* Message "aucun resultat" */}
      {isOpen && !isLoading && suggestions.length === 0 && inputValue.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-sm text-gray-500">
          Aucune commune trouvee
        </div>
      )}
    </div>
  );
}
