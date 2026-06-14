"use client";

// PAGE DE DÉMO (noindex) — aperçu du futur formulaire de réclamation de fiche.
// Deux variantes basculables : A (écran léger) et B (parcours guidé).
// Données d'exemple en dur (AVENIRS ELEC) — aucun submit réel.

import { useState } from "react";

const SAMPLE = {
  name: "AVENIRS ELEC",
  metier: "Électricien",
  ville: "Châtellerault (86)",
  siretMasked: "508 056 249 •••••",
  siretPlaceholder: "508 056 249 0••••",
};

function Stepper({ active }: { active: number }) {
  const steps = ["Identité", "Code", "En ligne"];
  return (
    <div className="flex items-start justify-between mb-6">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                i === active
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--border-color)] text-[var(--text-tertiary)]"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-[11px] mt-1.5 ${
                i === active
                  ? "text-[var(--accent)] font-semibold"
                  : "text-[var(--text-tertiary)]"
              }`}
            >
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-px bg-[var(--border-color)] mx-2 mt-3.5" />
          )}
        </div>
      ))}
    </div>
  );
}

function FicheCard({ compact }: { compact?: boolean }) {
  return (
    <div className="bg-[#FF5A36]/5 dark:bg-[#FF5A36]/8 border border-[#FF5A36]/20 dark:border-[#FF5A36]/30 rounded-2xl p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
        </svg>
        <span className="text-xs font-semibold text-green-700 dark:text-green-400">
          Vérifié au registre Sirene
        </span>
      </div>
      <p className="font-semibold text-[15px] text-[var(--text-primary)]">{SAMPLE.name}</p>
      <p className="text-sm text-[var(--text-secondary)] mb-1">
        {SAMPLE.metier} · {SAMPLE.ville}
      </p>
      <p className="text-xs font-mono text-[var(--text-tertiary)]">
        {compact ? SAMPLE.siretMasked : `SIRET ${SAMPLE.siretMasked}`}
      </p>
      {compact && (
        <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-[#FF5A36]/20">
          <svg className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">
            Email manquant — vos clients ne peuvent pas vous joindre
          </span>
        </div>
      )}
    </div>
  );
}

function VariantA() {
  const [showPw, setShowPw] = useState(false);
  return (
    <div>
      <Stepper active={0} />

      <div className="mb-5">
        <FicheCard compact />
      </div>

      <div className="bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-2xl p-6 shadow-lg shadow-[#FF5A36]/5 dark:shadow-black/30 space-y-5">
        {/* SIRET — reframé "confirmez" */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Confirmez votre SIRET
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder={SAMPLE.siretPlaceholder}
            className="w-full h-12 px-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] font-mono placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all duration-250"
          />
          <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
            On l&apos;affiche au-dessus — recopiez-le, c&apos;est votre preuve d&apos;identité.
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Votre email
          </label>
          <input
            type="email"
            placeholder="vous@exemple.fr"
            className="w-full h-12 px-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all duration-250"
          />
          <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
            Pour recevoir le code + vous connecter. Boîte pro qui filtre&nbsp;? Un Gmail passe mieux.
          </p>
        </div>

        {/* Mot de passe — 1 champ + œil */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Mot de passe
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="8 caractères minimum"
              className="w-full h-12 px-4 pr-12 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 transition-all duration-250"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              {showPw ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
            8 caractères dont au moins 1 chiffre.
          </p>
        </div>

        <button
          type="button"
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3.5 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          Recevoir mon code de validation
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        <p className="text-center text-xs text-[var(--text-tertiary)]">
          Gratuit · 2 min · sans engagement
        </p>
        <div className="flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
          </svg>
          <span className="text-[11px] text-[var(--text-secondary)]">
            Nom &amp; téléphone&nbsp;: demandés juste après
          </span>
        </div>
      </div>
    </div>
  );
}

function VariantB() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
          Étape 1 sur 3
        </span>
      </div>

      <div className="bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-2xl p-6 sm:p-8 shadow-lg shadow-[#FF5A36]/5 dark:shadow-black/30">
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-full bg-[#FF5A36]/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72l1.189-1.19A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
            Est-ce bien votre entreprise&nbsp;?
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            On l&apos;a trouvée sur le registre officiel.
          </p>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 text-center mb-5">
          <div className="inline-flex items-center gap-1.5 mb-2">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
            </svg>
            <span className="text-xs font-semibold text-green-700 dark:text-green-400">
              Vérifié au registre Sirene
            </span>
          </div>
          <p className="font-semibold text-base text-[var(--text-primary)]">{SAMPLE.name}</p>
          <p className="text-sm text-[var(--text-secondary)] mb-1">
            {SAMPLE.metier} · {SAMPLE.ville}
          </p>
          <p className="text-xs font-mono text-[var(--text-tertiary)]">SIRET {SAMPLE.siretMasked}</p>
        </div>

        <button
          type="button"
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3.5 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02] flex items-center justify-center gap-2 mb-3"
        >
          Oui, c&apos;est mon entreprise
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
        <button
          type="button"
          className="w-full border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] px-6 py-3 rounded-full text-sm font-medium transition-all duration-250"
        >
          Ce n&apos;est pas moi
        </button>

        <div className="border-t border-[var(--card-border)] mt-5 pt-4">
          <p className="text-[11px] text-[var(--text-tertiary)] text-center leading-relaxed">
            Ensuite&nbsp;: <span className="text-[var(--text-secondary)]">email</span> →{" "}
            <span className="text-[var(--text-secondary)]">code reçu</span> →{" "}
            <span className="text-[var(--accent)] font-semibold">en ligne</span>.<br />
            Le mot de passe se choisit tout à la fin.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TestClaimRedesign() {
  const [variant, setVariant] = useState<"A" | "B">("A");

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      {/* Bandeau démo */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-6 text-center">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Page de démonstration — aperçu du futur formulaire (non fonctionnel)
        </p>
      </div>

      {/* Sélecteur de variante */}
      <div className="flex gap-2 mb-8 p-1 bg-[var(--bg-secondary)] rounded-full">
        <button
          type="button"
          onClick={() => setVariant("A")}
          className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-250 ${
            variant === "A"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          A — Écran léger
        </button>
        <button
          type="button"
          onClick={() => setVariant("B")}
          className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all duration-250 ${
            variant === "B"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          B — Parcours guidé
        </button>
      </div>

      {variant === "A" ? <VariantA /> : <VariantB />}
    </main>
  );
}
