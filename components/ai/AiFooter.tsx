import Link from "next/link";

/**
 * Footer minimaliste Workwave AI (style peec.ai).
 *
 * Sobre, beaucoup d'espace, lien retour vers Workwave BTP pour
 * indiquer aux visiteurs qu'on a deja un autre vertical etabli.
 */
export default function AiFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] mt-24"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          {/* Colonne 1 : Workwave AI */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/ai" className="flex items-center gap-2.5 mb-4 group">
              <div
                className="grid grid-cols-2 grid-rows-2 gap-[2px] w-7 h-7 transition-transform duration-200 group-hover:rotate-90"
                aria-hidden="true"
              >
                <div className="bg-[var(--ai-accent)] rounded-[2px]" />
                <div className="bg-[var(--ai-text)] rounded-[2px]" />
                <div className="bg-[var(--ai-text)] rounded-[2px]" />
                <div className="bg-[var(--ai-accent)] rounded-[2px]" />
              </div>
              <span className="text-[15px] font-semibold text-[var(--ai-text)] tracking-tight">
                Workwave <span className="text-[var(--ai-text-tertiary)] font-medium">AI</span>
              </span>
            </Link>
            <p className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed">
              Plateforme de mise en relation entre porteurs de projet tech et freelances IA, dev, cloud, no-code, data, design.
            </p>
          </div>

          {/* Colonne 2 : Pour les clients */}
          <div>
            <p className="text-[11px] font-semibold text-[var(--ai-text-tertiary)] uppercase tracking-wider mb-3">
              Clients
            </p>
            <ul className="space-y-2 text-[13px] text-[var(--ai-text-secondary)]">
              <li>
                <Link href="/ai/deposer" className="hover:text-[var(--ai-text)] transition-colors">
                  Déposer un projet
                </Link>
              </li>
              <li>
                <Link href="/ai" className="hover:text-[var(--ai-text)] transition-colors">
                  Trouver un freelance
                </Link>
              </li>
              <li>
                <Link href="/ai/comment-ca-marche" className="hover:text-[var(--ai-text)] transition-colors">
                  Comment ça marche
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Pour les freelances */}
          <div>
            <p className="text-[11px] font-semibold text-[var(--ai-text-tertiary)] uppercase tracking-wider mb-3">
              Freelances
            </p>
            <ul className="space-y-2 text-[13px] text-[var(--ai-text-secondary)]">
              <li>
                <Link href="/ai/pour-les-freelances" className="hover:text-[var(--ai-text)] transition-colors">
                  Pourquoi nous
                </Link>
              </li>
              <li>
                <Link href="/ai/tarifs" className="hover:text-[var(--ai-text)] transition-colors">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link href="/ai/inscription" className="hover:text-[var(--ai-text)] transition-colors">
                  S&apos;inscrire
                </Link>
              </li>
              <li>
                <Link href="/ai/connexion" className="hover:text-[var(--ai-text)] transition-colors">
                  Connexion
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 4 : Workwave */}
          <div>
            <p className="text-[11px] font-semibold text-[var(--ai-text-tertiary)] uppercase tracking-wider mb-3">
              Workwave
            </p>
            <ul className="space-y-2 text-[13px] text-[var(--ai-text-secondary)]">
              <li>
                <Link href="/a-propos" className="hover:text-[var(--ai-text)] transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="/cgu" className="hover:text-[var(--ai-text)] transition-colors">
                  CGU
                </Link>
              </li>
              <li>
                <Link href="/mentions-legales" className="hover:text-[var(--ai-text)] transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <a href="mailto:contact@workwave.fr" className="hover:text-[var(--ai-text)] transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bas : copyright + lien vertical BTP */}
        <div className="pt-8 border-t border-[var(--ai-border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[12px] text-[var(--ai-text-tertiary)]">
            © {year} Workwave. Tous droits réservés.
          </p>
          <Link
            href="/"
            className="text-[12px] text-[var(--ai-text-secondary)] hover:text-[var(--ai-text)] transition-colors inline-flex items-center gap-1.5"
          >
            <span>Vous cherchez un artisan BTP ?</span>
            <span className="font-medium underline decoration-[var(--ai-border)] underline-offset-2">
              workwave.fr
            </span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
