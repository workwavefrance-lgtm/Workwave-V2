"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { lookupBySiret, type LookupState } from "./actions";

const initialState: LookupState = { success: false };

function formatSiret(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
}

export default function RetrouverFicheForm() {
  const [state, formAction, isPending] = useActionState(
    lookupBySiret,
    initialState
  );
  const [siret, setSiret] = useState("");

  const digitsCount = siret.replace(/\D/g, "").length;
  // SIRET 14 chiffres (France) ou n. BCE 10 chiffres (Belgique).
  const isComplete = digitsCount === 14 || digitsCount === 10;

  return (
    <form action={formAction} className="space-y-5">
      {/* Honeypot anti-bot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] w-0 h-0"
        aria-hidden="true"
      />

      {/* Erreur (cachee pendant isPending pour pas de flash stale) */}
      {state.message && !state.success && !isPending && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400">
            {state.message}
          </p>
        </div>
      )}

      <div>
        <label
          htmlFor="siret"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
          Numéro d'entreprise
        </label>
        <input
          id="siret"
          name="siret"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          placeholder="N° SIRET ou BCE"
          maxLength={17}
          value={siret}
          onChange={(e) => setSiret(formatSiret(e.target.value))}
          className="w-full h-14 px-4 rounded-xl border bg-[var(--bg-primary)] text-[var(--text-primary)] text-lg font-mono tracking-wide placeholder:text-[var(--text-tertiary)] placeholder:font-sans placeholder:text-base transition-all duration-250 outline-none border-[var(--border-color)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
        />
        <p className="mt-2 text-xs text-[var(--text-tertiary)]">
          France : SIRET (14 chiffres) · Belgique : BCE (10 chiffres) — {digitsCount} saisis
        </p>
      </div>

      <button
        type="submit"
        disabled={!isComplete || isPending}
        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02] disabled:hover:scale-100 flex items-center justify-center gap-2"
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

      {/* Alternative : creer une fiche si pas dans notre base */}
      <div className="pt-6 border-t border-[var(--border-color)]">
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          Pas encore référencé ? Enregistrez-vous en 1 minute :
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href={
              isComplete
                ? `/pro/creer-fiche?siret=${siret.replace(/\D/g, "")}`
                : "/pro/creer-fiche"
            }
            className="flex-1 text-center px-4 py-2.5 rounded-full bg-[var(--accent)] text-white text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors"
          >
            Créer ma fiche BTP
          </Link>
          <Link
            href="/ai/inscription"
            className="flex-1 text-center px-4 py-2.5 rounded-full border border-[var(--border-color)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            Freelance tech (Workwave AI)
          </Link>
        </div>
      </div>
    </form>
  );
}
