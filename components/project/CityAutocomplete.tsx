"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type CityResult = {
  id: number;
  name: string;
  postal_code: string | null;
};

type Props = {
  onSelect: (cityId: number, cityName: string) => void;
  error?: string;
};

export default function CityAutocomplete({ onSelect, error }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCities = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/cities/search?q=${encodeURIComponent(q)}`
      );
      const data: CityResult[] = await res.json();
      setResults(data);
      setIsOpen(data.length > 0);
      setHighlightIndex(-1);
    } catch {
      setResults([]);
      setIsOpen(false);
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setSelectedName("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCities(value), 200);
  }

  function selectCity(city: CityResult) {
    setSelectedName(city.name);
    setQuery(city.name);
    setIsOpen(false);
    setResults([]);
    onSelect(city.id, city.name);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && results[highlightIndex]) {
        selectCity(results[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  // Fermer au clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor="city-search"
        className="block text-sm font-medium text-[var(--text-primary)] mb-2"
      >
        Ville
      </label>
      <input
        ref={inputRef}
        id="city-search"
        type="text"
        autoComplete="off"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Poitiers, Châtellerault..."
        className={`w-full h-12 px-4 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-250 outline-none ${
          error
            ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
            : "border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
        }`}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="city-listbox"
        aria-activedescendant={
          highlightIndex >= 0 ? `city-option-${highlightIndex}` : undefined
        }
      />

      {isOpen && results.length > 0 && (
        <ul
          id="city-listbox"
          role="listbox"
          className="absolute z-50 top-full mt-2 w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-md overflow-hidden"
        >
          {results.map((city, i) => (
            <li
              key={city.id}
              id={`city-option-${i}`}
              role="option"
              aria-selected={i === highlightIndex}
              className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${
                i === highlightIndex
                  ? "bg-[var(--accent-muted)]"
                  : "hover:bg-[var(--bg-secondary)]"
              }`}
              onMouseDown={() => selectCity(city)}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {city.name}
              </span>
              {city.postal_code && (
                <span className="text-sm text-[var(--text-tertiary)] ml-2">
                  ({city.postal_code})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-1.5 text-sm text-red-500 animate-in">{error}</p>
      )}
    </div>
  );
}
