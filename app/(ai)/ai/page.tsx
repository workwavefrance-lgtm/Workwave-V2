import type { Metadata } from "next";

/**
 * Placeholder Phase 2 — vérifie que le layout AI s'applique bien
 * (background gris clair, typo Geist, boutons noirs, pas de coral).
 * La vraie landing peec.ai-style sera codée en Phase 3.
 */
export const metadata: Metadata = {
  title: "Workwave AI — Trouvez le freelance tech idéal",
  description:
    "Plateforme de mise en relation entre porteurs de projet et freelances tech (IA, dev, cloud, no-code). Inscription gratuite, matching par IA, sans crédit.",
};

export default function AiHomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
      {/* Badge "Bientôt disponible" style peec.ai */}
      <div className="flex justify-center mb-8">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--ai-accent-success-bg)] text-[var(--ai-accent-success)] text-[12px] font-medium">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent-success)]" />
          Phase 2/10 — Layout opérationnel
        </span>
      </div>

      {/* Hero placeholder */}
      <h1 className="text-4xl sm:text-6xl font-bold text-center text-[var(--ai-text)] mb-6 max-w-3xl mx-auto leading-tight">
        Workwave AI{" "}
        <span className="block text-[var(--ai-text-tertiary)] font-bold mt-2">
          pour les projets tech
        </span>
      </h1>

      <p className="text-center text-lg text-[var(--ai-text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
        Trouvez le freelance tech idéal pour votre projet IA, développement, cloud, no-code ou data. Matching par IA, inscription gratuite, sans crédit.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-16">
        <button
          type="button"
          className="inline-flex items-center justify-center h-11 px-6 text-[14px] font-semibold rounded-lg bg-[var(--ai-primary)] hover:bg-[var(--ai-primary-hover)] text-[var(--ai-primary-text)] transition-colors duration-150 w-full sm:w-auto"
        >
          Déposer un projet
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center h-11 px-6 text-[14px] font-semibold rounded-lg bg-[var(--ai-secondary)] hover:bg-[var(--ai-secondary-hover)] text-[var(--ai-secondary-text)] border border-[var(--ai-secondary-border)] transition-colors duration-150 w-full sm:w-auto"
        >
          Voir les freelances
        </button>
      </div>

      {/* Card test pour valider tokens visuels */}
      <div
        className="bg-[var(--ai-bg-card)] border border-[var(--ai-border)] rounded-xl p-8 max-w-2xl mx-auto"
        style={{ boxShadow: "var(--ai-shadow-md)" }}
      >
        <p className="text-[14px] font-semibold text-[var(--ai-text)] mb-2">
          Validation Phase 2
        </p>
        <ul className="text-[13px] text-[var(--ai-text-secondary)] space-y-1.5">
          <li>✓ Background gris ultra-clair (#F7F7F7)</li>
          <li>✓ Typo Geist Sans propagée du root</li>
          <li>✓ Boutons primaires noirs (pas de coral)</li>
          <li>✓ Header minimaliste avec logo Workwave AI</li>
          <li>✓ Footer 4 colonnes avec retour vers Workwave BTP</li>
          <li>
            ✓ Aucun composant BTP (RecentClaimsToast, Léa coral, CookieBanner global) sur cette route
          </li>
        </ul>
        <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-6 leading-relaxed">
          Cette page est un placeholder Phase 2 pour valider l&apos;application du layout dédié. La vraie landing peec.ai-style arrive en Phase 3.
        </p>
      </div>
    </div>
  );
}
