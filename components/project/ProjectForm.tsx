"use client";

import { useActionState, useRef, useState } from "react";
import { submitProject, type FormState } from "@/app/(public)/deposer-projet/actions";
import CityAutocomplete from "@/components/project/CityAutocomplete";

type Category = {
  id: number;
  name: string;
  vertical: string;
};

type Props = {
  categories: Category[];
};

const VERTICAL_LABELS: Record<string, string> = {
  btp: "BTP et artisanat",
  domicile: "Services à domicile",
  personne: "Aide à la personne",
};

const URGENCY_OPTIONS = [
  { value: "today", label: "Aujourd'hui" },
  { value: "this_week", label: "Cette semaine" },
  { value: "this_month", label: "Ce mois-ci" },
  { value: "not_urgent", label: "Pas pressé" },
];

const BUDGET_OPTIONS = [
  { value: "lt500", label: "Moins de 500 €" },
  { value: "500_2000", label: "500 € – 2 000 €" },
  { value: "2000_5000", label: "2 000 € – 5 000 €" },
  { value: "5000_15000", label: "5 000 € – 15 000 €" },
  { value: "gt15000", label: "Plus de 15 000 €" },
  { value: "unknown", label: "Je ne sais pas" },
];

const initialState: FormState = { success: false };

export default function ProjectForm({ categories }: Props) {
  const [state, formAction, isPending] = useActionState(
    submitProject,
    initialState
  );
  const [cityId, setCityId] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Grouper les catégories par vertical
  const grouped: Record<string, Category[]> = {};
  for (const cat of categories) {
    if (!grouped[cat.vertical]) grouped[cat.vertical] = [];
    grouped[cat.vertical].push(cat);
  }

  function handleCitySelect(id: number) {
    setCityId(id);
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-8">
      {/* Message d'erreur global */}
      {state.message && !state.success && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.message}
          </p>
        </div>
      )}

      {/* --- Catégorie --- */}
      <div>
        <label
          htmlFor="categoryId"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
          Type de travaux
        </label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue=""
          className={`w-full h-12 px-4 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] transition-all duration-250 outline-none appearance-none cursor-pointer ${
            state.errors?.categoryId
              ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          }`}
        >
          <option value="" disabled>
            Choisissez un métier...
          </option>
          {(["btp", "domicile", "personne"] as const).map((vertical) =>
            grouped[vertical] ? (
              <optgroup key={vertical} label={VERTICAL_LABELS[vertical]}>
                {grouped[vertical].map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </optgroup>
            ) : null
          )}
        </select>
        {state.errors?.categoryId && (
          <p className="mt-1.5 text-sm text-red-500">
            {state.errors.categoryId}
          </p>
        )}
      </div>

      {/* --- Ville (autocomplete) --- */}
      <div>
        <CityAutocomplete
          onSelect={handleCitySelect}
          error={state.errors?.cityId}
        />
        <input type="hidden" name="cityId" value={cityId ?? ""} />
      </div>

      {/* --- Description --- */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
          Description du projet
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Décrivez votre besoin en quelques phrases : type de travaux, surface, contraintes particulières..."
          className={`w-full px-4 py-3 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-250 outline-none resize-y ${
            state.errors?.description
              ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          }`}
        />
        {state.errors?.description && (
          <p className="mt-1.5 text-sm text-red-500">
            {state.errors.description}
          </p>
        )}
      </div>

      {/* --- Urgence (radio pills) --- */}
      <fieldset>
        <legend className="block text-sm font-medium text-[var(--text-primary)] mb-3">
          Urgence
        </legend>
        <div className="flex flex-wrap gap-2">
          {URGENCY_OPTIONS.map((opt) => (
            <label key={opt.value} className="cursor-pointer">
              <input
                type="radio"
                name="urgency"
                value={opt.value}
                className="peer sr-only"
              />
              <span className="inline-block px-4 py-2.5 rounded-full text-sm font-medium border border-[var(--border-color)] text-[var(--text-secondary)] bg-[var(--bg-primary)] transition-all duration-250 peer-checked:bg-[var(--accent)] peer-checked:text-white peer-checked:border-[var(--accent)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)]/40 hover:border-[var(--text-tertiary)]">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
        {state.errors?.urgency && (
          <p className="mt-1.5 text-sm text-red-500">{state.errors.urgency}</p>
        )}
      </fieldset>

      {/* --- Budget --- */}
      <div>
        <label
          htmlFor="budget"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
          Budget estimé
        </label>
        <select
          id="budget"
          name="budget"
          defaultValue=""
          className={`w-full h-12 px-4 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] transition-all duration-250 outline-none appearance-none cursor-pointer ${
            state.errors?.budget
              ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
          }`}
        >
          <option value="" disabled>
            Sélectionnez un budget...
          </option>
          {BUDGET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {state.errors?.budget && (
          <p className="mt-1.5 text-sm text-red-500">{state.errors.budget}</p>
        )}
      </div>

      {/* --- Contact : Prénom, Email, Téléphone --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-[var(--text-primary)] mb-2"
          >
            Prénom
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            placeholder="Jean"
            className={`w-full h-12 px-4 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-250 outline-none ${
              state.errors?.firstName
                ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            }`}
          />
          {state.errors?.firstName && (
            <p className="mt-1.5 text-sm text-red-500">
              {state.errors.firstName}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[var(--text-primary)] mb-2"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="jean@exemple.fr"
            className={`w-full h-12 px-4 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-250 outline-none ${
              state.errors?.email
                ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            }`}
          />
          {state.errors?.email && (
            <p className="mt-1.5 text-sm text-red-500">{state.errors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-[var(--text-primary)] mb-2"
          >
            Téléphone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="06 12 34 56 78"
            className={`w-full h-12 px-4 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-250 outline-none ${
              state.errors?.phone
                ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                : "border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            }`}
          />
          {state.errors?.phone && (
            <p className="mt-1.5 text-sm text-red-500">{state.errors.phone}</p>
          )}
        </div>
      </div>

      {/* --- RGPD --- */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            name="consent"
            className="mt-0.5 h-5 w-5 rounded border-[var(--border-color)] text-[var(--accent)] focus:ring-[var(--accent)]/20 cursor-pointer"
          />
          <span className="text-sm text-[var(--text-secondary)] leading-relaxed">
            J&apos;accepte que mes données soient transmises aux professionnels
            concernés pour traiter ma demande.{" "}
            <a href="/mentions-legales" className="underline hover:text-[var(--accent)] transition-colors duration-250">
              Voir nos mentions légales
            </a>
          </span>
        </label>
        {state.errors?.consent && (
          <p className="mt-1.5 text-sm text-red-500">{state.errors.consent}</p>
        )}
      </div>

      {/* --- Honeypot (invisible) --- */}
      <div aria-hidden="true" className="absolute -left-[9999px] opacity-0 h-0 overflow-hidden">
        <label htmlFor="website">Ne pas remplir</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* --- Submit --- */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full sm:w-auto bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white px-10 py-3.5 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02] disabled:hover:scale-100 flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Envoi en cours...
          </>
        ) : (
          "Envoyer ma demande"
        )}
      </button>
    </form>
  );
}
