import React, { useState, useRef, useEffect } from 'react';
import { searchLocations } from '../../utils/locationiq';
import type { LocationSuggestion } from '../../utils/locationiq';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: LocationSuggestion) => void;
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  touched?: boolean;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  onBlur,
  placeholder = 'e.g., Meppadi, Kerala',
  error,
  touched,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    try {
      const results = await searchLocations(query);
      // Ensure we treat results as proper objects we can map
      setSuggestions(results);
      setIsOpen(true);
    } catch (err) {
      console.error('LocationIQ API error:', err);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = (suggestion: LocationSuggestion) => {
    onChange(suggestion.display_name);
    if (onSelect) {
      onSelect(suggestion);
    }
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="mb-4 relative" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Pickup Address Location
      </label>

      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onBlur={onBlur}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${touched && error ? 'border-red-500' : 'border-gray-300'
          }`}
      />

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((sugg, idx) => (
            <li
              key={sugg.place_id || idx}
              onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
              onClick={() => handleSelect(sugg)}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-800"
            >
              {sugg.display_name}
            </li>
          ))}
        </ul>
      )}

      {touched && error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export default AddressAutocomplete;
