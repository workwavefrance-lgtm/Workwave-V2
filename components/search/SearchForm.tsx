"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SearchFormProps = {
  categories: { slug: string; name: string }[];
  cities: { slug: string; name: string }[];
};

export default function SearchForm({ categories, cities }: SearchFormProps) {
  const router = useRouter();
  const [metier, setMetier] = useState("");
  const [ville, setVille] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (metier && ville) {
      router.push(`/${metier}/${ville}`);
    } else if (metier) {
      router.push(`/${metier}/vienne-86`);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row items-stretch gap-3 w-full max-w-2xl mx-auto bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl sm:rounded-full p-2 shadow-sm hover:shadow-md transition-shadow duration-250"
    >
      <div className="flex-1 flex items-center gap-3 pl-4">
        {/* Loupe */}
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
          <option value="">Quel metier ?</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden sm:block w-px bg-[var(--border-color)]" />

      <div className="flex-1 flex items-center pl-4 sm:pl-2">
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
        <select
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] py-3 outline-none appearance-none cursor-pointer"
        >
          <option value="">Toute la Vienne (86)</option>
          {cities.map((city) => (
            <option key={city.slug} value={city.slug}>
              {city.name}
            </option>
          ))}
        </select>
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
