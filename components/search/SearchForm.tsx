"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type CityResult = {
  id: number;
  name: string;
  slug: string;
  postal_code: string | null;
  department_code: string;
};

type Category = { slug: string; name: string; vertical: string };

type SearchFormProps = {
  categories: Category[];
};

// Libellés + ordre d'affichage des univers (le `<select>` à plat était illisible
// avec 40+ métiers alphabétiques ; on regroupe par vertical + recherche).
const VERTICAL_LABELS: Record<string, string> = {
  btp: "Bâtiment & travaux",
  domicile: "Services à domicile",
  personne: "Aide à la personne",
};
const VERTICAL_ORDER = ["btp", "domicile", "personne"];

// Recherche insensible aux accents/casse. Escapes \u (pas de char combinant
// littéral dans la source — cf. CLAUDE.md 26/05).
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export default function SearchForm({ categories }: SearchFormProps) {
  const router = useRouter();

  // --- Métier (combobox searchable groupé) ---
  const [metierQuery, setMetierQuery] = useState("");
  const [metierSlug, setMetierSlug] = useState("");
  const [showMetier, setShowMetier] = useState(false);
  const metierRef = useRef<HTMLDivElement>(null);

  // --- Ville (autocomplete API) ---
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const [suggestions, setSuggestions] = useState<CityResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  // Métiers filtrés + groupés par univers (filtrage 100% client : ~40 items).
  const metierGroups = useMemo(() => {
    const q = normalize(metierQuery.trim());
    // Si un métier est sélectionné et le texte == son nom, ne pas re-filtrer.
    const filtered =
      q.length === 0 || (metierSlug && q === normalize(metierQuery))
        ? categories
        : categories.filter((c) => normalize(c.name).includes(q));
    const byVertical = new Map<string, Category[]>();
    for (const c of filtered) {
      const arr = byVertical.get(c.vertical) || [];
      arr.push(c);
      byVertical.set(c.vertical, arr);
    }
    return VERTICAL_ORDER.filter((v) => byVertical.has(v)).map((v) => ({
      vertical: v,
      label: VERTICAL_LABELS[v] || v,
      items: (byVertical.get(v) || []).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }));
  }, [categories, metierQuery, metierSlug]);

  const flatFiltered = useMemo(
    () => metierGroups.flatMap((g) => g.items),
    [metierGroups]
  );

  function selectMetier(cat: Category) {
    setMetierSlug(cat.slug);
    setMetierQuery(cat.name);
    setShowMetier(false);
  }

  // Debounced city search
  useEffect(() => {
    if (selectedCity && cityQuery === formatCityLabel(selectedCity)) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
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

  // Fermer les dropdowns au clic en dehors (métier + ville)
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (metierRef.current && !metierRef.current.contains(t))
        setShowMetier(false);
      if (cityRef.current && !cityRef.current.contains(t))
        setShowSuggestions(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function formatCityLabel(city: CityResult): string {
    return city.postal_code ? `${city.name} (${city.postal_code})` : city.name;
  }

  function handleSelectCity(city: CityResult) {
    setSelectedCity(city);
    setCityQuery(formatCityLabel(city));
    setShowSuggestions(false);
    setSuggestions([]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Métier : slug sélectionné, sinon 1er résultat filtré si l'utilisateur a tapé.
    const slug = metierSlug || (metierQuery.trim() ? flatFiltered[0]?.slug : "");
    if (!slug) {
      setShowMetier(true);
      return;
    }
    if (selectedCity) {
      router.push(`/${slug}/${selectedCity.slug}`);
    } else if (cityQuery.trim() && suggestions.length > 0) {
      router.push(`/${slug}/${suggestions[0].slug}`);
    } else {
      router.push(`/${slug}`);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row items-stretch gap-3 w-full max-w-2xl mx-auto bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl sm:rounded-full p-2 shadow-sm hover:shadow-md transition-shadow duration-250"
    >
      {/* Sélecteur métier — combobox searchable groupé */}
      <div ref={metierRef} className="flex-1 relative flex items-center gap-3 pl-4">
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
        <input
          type="text"
          value={metierQuery}
          onChange={(e) => {
            setMetierQuery(e.target.value);
            setMetierSlug("");
            setShowMetier(true);
          }}
          onFocus={() => setShowMetier(true)}
          placeholder="Quel métier ?"
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] py-3 outline-none placeholder:text-[var(--text-tertiary)]"
          autoComplete="off"
        />

        {showMetier && metierGroups.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-lg z-50 max-h-[min(70vh,24rem)] overflow-y-auto py-1">
            {metierGroups.map((group) => (
              <div key={group.vertical}>
                <div className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  {group.label}
                </div>
                {group.items.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => selectMetier(cat)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-[var(--bg-secondary)] ${
                      metierSlug === cat.slug
                        ? "text-[var(--accent)] font-medium"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {showMetier &&
          metierQuery.trim().length > 0 &&
          metierGroups.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl shadow-lg z-50 px-4 py-3 text-sm text-[var(--text-tertiary)]">
              Aucun métier trouvé. Essayez un autre mot.
            </div>
          )}
      </div>

      <div className="hidden sm:block w-px bg-[var(--border-color)]" />

      {/* Autocomplete ville */}
      <div ref={cityRef} className="flex-1 relative flex items-center pl-4 sm:pl-2">
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
