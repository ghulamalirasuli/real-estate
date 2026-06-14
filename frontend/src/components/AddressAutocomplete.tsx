import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface Suggestion {
  display: string;
  lat: number;
  lon: number;
  city?: string;
  country?: string;
  state?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onSelect: (address: string, lat: string, lng: string) => void;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const PHOTON_API = 'https://photon.komoot.io/api';

export default function AddressAutocomplete({
  value,
  onSelect,
  onChange,
  placeholder,
  required,
}: AddressAutocompleteProps) {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Search Photon API with debounce
  const searchAddress = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    try {
      const url = `${PHOTON_API}?q=${encodeURIComponent(query)}&limit=5&lang=en`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RealEstatePlatform/1.0 (property listing app)',
        },
      });

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      const features = data.features || [];

      const results: Suggestion[] = features.map((f: any) => {
        const props = f.properties || {};
        const coords = f.geometry?.coordinates || [];
        const parts = [props.name, props.city, props.state, props.country].filter(Boolean);
        return {
          display: parts.join(', '),
          lat: coords[1] || 0,
          lon: coords[0] || 0,
          city: props.city,
          state: props.state,
          country: props.country,
        };
      });

      setSuggestions(results);
      setIsOpen(results.length > 0);
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    // Debounce search
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAddress(val), 400);
  };

  const handleSelect = (suggestion: Suggestion) => {
    onSelect(suggestion.display, String(suggestion.lat), String(suggestion.lon));
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          handleSelect(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          required={required}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10"
          placeholder={placeholder || 'Search address...'}
          autoComplete="off"
        />

        {/* Search spinner or icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`px-4 py-3 cursor-pointer text-sm transition flex items-start gap-3 ${
                index === activeIndex
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              } ${index !== suggestions.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
            >
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="font-medium">{suggestion.display}</p>
                {suggestion.city && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[suggestion.city, suggestion.state, suggestion.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* No results hint */}
      {isOpen && suggestions.length === 0 && value.trim().length >= 3 && !isSearching && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
          {t('common.noResults')}
        </div>
      )}
    </div>
  );
}
