import Link from "next/link";

/**
 * Header minimaliste pour Workwave AI (style peec.ai / Linear).
 *
 * - Logo "Workwave AI" en noir pur (vs coral du BTP)
 * - Nav simple : Trouver un freelance / Pour les freelances / Tarifs
 * - CTA primaire noir "Déposer un projet"
 * - Sticky avec backdrop blur subtil au scroll
 */
export default function AiHeader() {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md bg-[var(--ai-bg)]/85 border-b border-[var(--ai-border-subtle)]"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/ai"
          className="flex items-center gap-2 group"
          aria-label="Workwave AI — Accueil"
        >
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[var(--ai-text)] text-white font-bold text-[14px] tracking-tight"
            aria-hidden="true"
          >
            W
          </span>
          <span className="text-[15px] font-semibold text-[var(--ai-text)] tracking-tight">
            Workwave <span className="text-[var(--ai-text-tertiary)] font-medium">AI</span>
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-7 text-[14px] text-[var(--ai-text-secondary)]">
          <Link
            href="/ai"
            className="hover:text-[var(--ai-text)] transition-colors duration-150"
          >
            Trouver un freelance
          </Link>
          <Link
            href="/ai/pour-les-freelances"
            className="hover:text-[var(--ai-text)] transition-colors duration-150"
          >
            Pour les freelances
          </Link>
          <Link
            href="/ai/tarifs"
            className="hover:text-[var(--ai-text)] transition-colors duration-150"
          >
            Tarifs
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/ai/connexion"
            className="hidden sm:inline-flex items-center h-9 px-4 text-[13px] font-medium text-[var(--ai-text)] hover:bg-[var(--ai-bg-subtle)] rounded-lg transition-colors duration-150"
          >
            Connexion
          </Link>
          <Link
            href="/ai/deposer"
            className="inline-flex items-center h-9 px-4 text-[13px] font-semibold rounded-lg bg-[var(--ai-primary)] hover:bg-[var(--ai-primary-hover)] text-[var(--ai-primary-text)] transition-colors duration-150"
          >
            Déposer un projet
          </Link>
        </div>
      </div>
    </header>
  );
}
