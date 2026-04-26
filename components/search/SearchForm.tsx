"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type CityResult = {
  id: number;
  name: string;
  slug: string;
  postal_code: string | null;
  department_code: string;
};

type SearchFormProps = {
  categories: { slug: string; name: string }[];
};

export default function SearchForm({ categories }: SearchFormProps) {
  const router = useRouter();
  const [metier, setMetier] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const [suggestions, setSuggestions] = useState<CityResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced API call
  useEffect(() => {
    if (selectedCity && cityQuery === formatCityLabel(selectedCity)) {
      return; // ne pas re-rechercher si on vient de selectionner
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (cityQuery.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/cities/search?q=${encodeURIComponent(cityQuery)}`
        );
        const data = (await res.json()) as CityResult[];
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [cityQuery, selectedCity]);

  // Fermer les suggestions au clic en dehors
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function formatCityLabel(city: CityResult): string {
    return city.postal_code
      ? `${city.name} (${city.postal_code})`
      : city.name;
  }

  function handleSelectCity(city: CityResult) {
    setSelectedCity(city);
    setCityQuery(formatCityLabel(city));
    setShowSuggestions(false);
    setSuggestions([]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!metier) return;

    if (selectedCity) {
      router.push(`/${metier}/${selectedCity.slug}`);
    } else if (cityQuery.trim()) {
      // L'utilisateur a tape mais pas selectionne - prendre la 1ere suggestion
      if (suggestions.length > 0) {
        router.push(`/${metier}/${suggestions[0].slug}`);
      } else {
        // Aucune suggestion : fallback page racine proximity
        router.push(`/${metier}`);
      }
    } else {
      // Pas de ville : fallback page racine proximity
      router.push(`/${metier}`);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row items-stretch gap-3 w-full max-w-2xl mx-auto bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl sm:rounded-full p-2 shadow-sm hover:shadow-md transition-shadow duration-250"
    >
      {/* Selecteur metier */}
      <div className="flex-1 flex items-center gap-3 pl-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-[var(--text-tertiary)] shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <select
          value={metier}
          onChange={(e) => setMetier(e.target.value)}
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] py-3 outline-none appearance-none cursor-pointer"
          required
        >
          <option value="">Quel métier ?</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden sm:block w-px bg-[var(--border-color)]" />

      {/* Autocomplete ville */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center pl-4 sm:pl-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-[var(--text-tertiary)] shrink-0 mr-3 sm:mr-2"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <input
          type="text"
          value={cityQuery}
          onChange={(e) => {
            setCityQuery(e.target.value);
            setSelectedCity(null);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Ville ou code postal"
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] py-3 outline-none placeholder:text-[var(--text-tertiary)]"
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 w-4 h-4 border-2 border-[var(--text-tertiary)] border-t-transparent rounded-full animate-spin" />
        )}

        {/* Dropdown suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-lg z-50 max-h-80 overflow-y-auto">
            {suggestions.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => handleSelectCity(city)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--bg-secondary)] transition-colors duration-150 first:rounded-t-2xl last:rounded-b-2xl"
              >
                <span className="text-sm text-[var(--text-primary)] font-medium">
                  {city.name}
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {city.postal_code} · {city.department_code}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Hint "aucune correspondance" */}
        {showSuggestions &&
          cityQuery.length >= 2 &&
          !isLoading &&
          suggestions.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-lg z-50 px-4 py-3 text-sm text-[var(--text-tertiary)]">
              Aucune commune trouvée. Essayez un autre nom ou code postal.
            </div>
          )}
      </div>

      <button
        type="submit"
        className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02] shrink-0"
      >
        Rechercher
      </button>
    </form>
  );
}
