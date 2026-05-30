"use client";

import { useActionState, useState } from "react";
import { createFiche, type CreateFicheState } from "./actions";

type Cat = { id: number; name: string };
export type Prefill = {
  name?: string | null;
  address?: string | null;
  postalCode?: string | null;
  commune?: string | null;
  naf?: string | null;
  foundingDate?: string | null;
} | null;

const initial: CreateFicheState = { success: false };

function formatSiret(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
}

const INPUT =
  "w-full h-12 px-4 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-all duration-200 outline-none border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20";
const LABEL = "block text-sm font-medium text-[var(--text-primary)] mb-2";

export default function CreerFicheForm({
  categories,
  prefill,
  siret,
}: {
  categories: Cat[];
  prefill: Prefill;
  siret: string;
}) {
  const [state, formAction, isPending] = useActionState(createFiche, initial);
  const [siretVal, setSiretVal] = useState(formatSiret(siret));

  return (
    <form action={formAction} className="space-y-5">
      {/* Honeypot */}
      <input
        type="text"
        name="website_hp"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] w-0 h-0"
        aria-hidden="true"
      />
      {/* Méta pré-remplies depuis l'API (transmises à l'action) */}
      <input type="hidden" name="postal_code" defaultValue={prefill?.postalCode || ""} />
      <input type="hidden" name="commune" defaultValue={prefill?.commune || ""} />
      <input type="hidden" name="naf" defaultValue={prefill?.naf || ""} />
      <input type="hidden" name="founding_date" defaultValue={prefill?.foundingDate || ""} />

      {state.message && !state.success && !isPending && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
        </div>
      )}

      {prefill?.name && (
        <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-3 text-sm text-[var(--text-secondary)]">
          ✓ Infos pré-remplies depuis le registre officiel (INSEE). Vérifiez et complétez.
        </div>
      )}

      <div>
        <label htmlFor="siret" className={LABEL}>Numéro SIRET</label>
        <input
          id="siret"
          name="siret"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="123 456 789 01234"
          maxLength={17}
          value={siretVal}
          onChange={(e) => setSiretVal(formatSiret(e.target.value))}
          className={`${INPUT} font-mono tracking-wide`}
          required
        />
      </div>

      <div>
        <label htmlFor="name" className={LABEL}>Nom de l&apos;entreprise</label>
        <input id="name" name="name" type="text" maxLength={150} defaultValue={prefill?.name || ""} placeholder="Ex : SARL Dupont Rénovation" className={INPUT} required />
      </div>

      <div>
        <label htmlFor="category_id" className={LABEL}>Votre métier</label>
        <select id="category_id" name="category_id" defaultValue="" className={INPUT} required>
          <option value="" disabled>Choisissez votre métier…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className={LABEL}>Email professionnel</label>
          <input id="email" name="email" type="email" maxLength={200} autoComplete="email" placeholder="votre.email@exemple.fr" className={INPUT} required />
        </div>
        <div>
          <label htmlFor="phone" className={LABEL}>Téléphone</label>
          <input id="phone" name="phone" type="tel" maxLength={30} autoComplete="tel" placeholder="06 12 34 56 78" className={INPUT} required />
        </div>
      </div>

      <div>
        <label htmlFor="address" className={LABEL}>
          Adresse <span className="text-[var(--text-tertiary)] font-normal">(optionnel)</span>
        </label>
        <input id="address" name="address" type="text" maxLength={300} defaultValue={prefill?.address || ""} className={INPUT} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
      >
        {isPending ? "Création…" : "Créer ma fiche gratuitement"}
      </button>

      <p className="text-xs text-[var(--text-tertiary)] text-center">
        Étape suivante : vous confirmez par un code envoyé à votre email pour activer votre fiche. Gratuit, sans engagement.
      </p>
    </form>
  );
}
