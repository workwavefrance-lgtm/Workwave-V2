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
 * Hero CTA de la landing /pro — layout "2 cartes" (variante B validée 08/07) :
 * - carte gauche : retrouver sa fiche par SIRET (Server Action lookupBySiret,
 *   rate-limit + honeypot + redirect côté serveur, logique inchangée) ;
 * - séparateur « ou » (vertical desktop, horizontal mobile) ;
 * - carte droite CORAL : inscription hors-base (/pro/creer-fiche) mise en
 *   avant — c'est le parcours des pros démarchés qui n'ont pas de fiche.
 */
export default function HeroSiretLookup() {
  const [state, formAction, isPending] = useActionState(
    lookupBySiret,
    initialState
  );
  const [siret, setSiret] = useState("");

  const digitsCount = siret.replace(/\D/g, "").length;
  // France : SIRET 14 chiffres. Belgique : numero d'entreprise BCE 10 chiffres.
  const isComplete = digitsCount === 14 || digitsCount === 10;
  const createHref = isComplete
    ? `/pro/creer-fiche?siret=${siret.replace(/\D/g, "")}${digitsCount === 10 ? "&pays=be" : ""}`
    : "/pro/creer-fiche";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-[1fr_auto_1fr] items-stretch text-left">
        {/* ── Carte gauche : retrouver sa fiche ── */}
        <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col gap-3">
          <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Déjà référencé ? Retrouvez votre fiche
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Tapez votre SIRET (France) ou votre n° BCE (Belgique), on retrouve votre entreprise :
          </p>

          <form action={formAction} className="space-y-2.5">
            {/* Honeypot anti-bot */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              className="absolute left-[-9999px] w-0 h-0"
              aria-hidden="true"
            />

            {/* Erreur (cachée pendant isPending) */}
            {state.message && !state.success && !isPending && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {state.message}
                </p>
              </div>
            )}

            {/* Champ + bouton inline */}
            <div className="flex gap-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full p-1.5 shadow-sm">
              <div className="relative flex-1 min-w-0">
                <svg
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]"
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
                  placeholder="SIRET ou n° d\u2019entreprise BCE"
                  value={siret}
                  maxLength={17}
                  onChange={(e) => setSiret(formatSiret(e.target.value))}
                  className="w-full h-11 pl-10 pr-2 bg-transparent text-sm sm:text-base font-mono tracking-wide text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] placeholder:font-sans placeholder:text-sm outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!isComplete || isPending}
                className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 sm:px-6 h-11 rounded-full text-sm transition-all duration-250 whitespace-nowrap inline-flex items-center justify-center gap-2"
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
                  "Trouver"
                )}
              </button>
            </div>

            <p className="text-xs text-[var(--text-tertiary)]">
              {digitsCount > 0 && !isComplete
                ? `${digitsCount} chiffres — SIRET : 14 (France) · BCE : 10 (Belgique)`
                : "SIRET 14 chiffres (France) ou n\u00b0 BCE 10 chiffres (Belgique), visibles sur vos documents officiels"}
            </p>
          </form>
        </div>

        {/* ── Séparateur « ou » ── */}
        <div className="flex md:flex-col flex-row items-center justify-center md:px-5 px-0 md:py-0 py-3.5">
          <div className="bg-[var(--border-color)] md:w-px md:flex-1 h-px flex-1" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)] border border-[var(--border-color)] bg-[var(--bg-primary)] rounded-full px-3 py-1.5 md:my-2.5 md:mx-0 mx-3">
            ou
          </span>
          <div className="bg-[var(--border-color)] md:w-px md:flex-1 h-px flex-1" />
        </div>

        {/* ── Carte droite CORAL : inscription ── */}
        <div className="bg-[var(--accent)] border border-[var(--accent)] rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col gap-3 text-white">
          <h3 className="text-lg sm:text-xl font-bold tracking-tight">
            Pas encore référencé ? Enregistrez-vous
          </h3>
          <p className="text-sm text-white/85">
            2 minutes chrono avec votre SIRET — et c&apos;est gratuit à vie.
          </p>
          <ul className="space-y-1.5 text-sm font-medium">
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="font-extrabold">✓</span>
              Vos 2 premiers leads offerts
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="font-extrabold">✓</span>
              Sans abonnement, 0 % de commission
            </li>
          </ul>
          <div className="flex-1" />
          <Link
            href={createHref}
            className="block text-center bg-white text-[var(--accent)] font-bold text-base px-5 py-3.5 rounded-full hover:opacity-90 transition-opacity duration-250"
          >
            Créer ma fiche gratuite →
          </Link>
        </div>
      </div>

      {/* Lien secondaire : connexion */}
      <div className="flex justify-center mt-6 text-sm">
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
