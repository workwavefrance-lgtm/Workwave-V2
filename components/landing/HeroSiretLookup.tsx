"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { lookupBySiret, type LookupState } from "@/app/(public)/pro/retrouver-fiche/actions";

const initialState: LookupState = { success: false };

function formatSiret(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
}

/**
 * Hero CTA inline pour la landing /pro : input SIRET + bouton "Trouver ma fiche"
 * directement sur la home pro, sans page intermediaire.
 *
 * Reutilise la Server Action `lookupBySiret` existante (la meme que
 * /pro/retrouver-fiche) : rate-limit + honeypot + redirect cote serveur.
 *
 * Friction zero : le pro voit le champ des qu'il arrive, tape son SIRET,
 * et est redirige automatiquement vers son claim flow (ou connexion si
 * deja reclame).
 */
export default function HeroSiretLookup() {
  const [state, formAction, isPending] = useActionState(
    lookupBySiret,
    initialState
  );
  const [siret, setSiret] = useState("");

  const digitsCount = siret.replace(/\D/g, "").length;
  const isComplete = digitsCount === 14;
  const createHref = isComplete
    ? `/pro/creer-fiche?siret=${siret.replace(/\D/g, "")}`
    : "/pro/creer-fiche";

  return (
    <div className="max-w-xl mx-auto">
      <form action={formAction} className="space-y-3">
        {/* Honeypot anti-bot */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="absolute left-[-9999px] w-0 h-0"
          aria-hidden="true"
        />

        {/* Erreur (cachee pendant isPending) */}
        {state.message && !state.success && !isPending && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3 text-left">
            <p className="text-sm text-red-600 dark:text-red-400">
              {state.message}
            </p>
          </div>
        )}

        {/* Champ + bouton inline */}
        <div className="flex flex-col sm:flex-row gap-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl sm:rounded-full p-2 shadow-sm">
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              name="siret"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Votre SIRET (14 chiffres)"
              value={siret}
              maxLength={17}
              onChange={(e) => setSiret(formatSiret(e.target.value))}
              className="w-full h-14 pl-12 pr-4 bg-transparent text-base sm:text-lg font-mono tracking-wide text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] placeholder:font-sans placeholder:text-base outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!isComplete || isPending}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 sm:px-8 h-12 sm:h-14 rounded-full text-sm sm:text-base transition-all duration-250 whitespace-nowrap inline-flex items-center justify-center gap-2"
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
                Recherche...
              </>
            ) : (
              "Trouver ma fiche"
            )}
          </button>
        </div>

        <p className="text-xs text-[var(--text-tertiary)]">
          {digitsCount > 0 && digitsCount < 14
            ? `${digitsCount}/14 chiffres`
            : "14 chiffres, visible sur tous vos documents officiels"}
        </p>
      </form>

      {/* Liens secondaires : créer une fiche (pro hors-base) + connexion. */}
      <div className="flex flex-col items-center gap-2.5 mt-6 text-sm">
        <Link
          href={createHref}
          className="text-[var(--accent)] font-semibold hover:underline underline-offset-4"
        >
          Pas encore référencé ? Enregistrez-vous →
        </Link>
        <Link
          href="/pro/connexion"
          className="text-[var(--text-secondary)] hover:text-[var(--accent)] underline decoration-[var(--border-color)] hover:decoration-[var(--accent)] underline-offset-4 transition-colors duration-250"
        >
          Déjà inscrit ? Connectez-vous
        </Link>
      </div>
    </div>
  );
}
