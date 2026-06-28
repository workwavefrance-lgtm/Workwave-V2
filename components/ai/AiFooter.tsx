"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Footer du vertical freelance (/ai/*) — unifié avec workwave.fr.
 *
 * Depuis le 28/06/2026 : wordmark "Workwave", accent coral, FR uniquement.
 * Caché sur /ai/dashboard (expérience freelance dédiée).
 */
export default function AiFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/ai/dashboard")) return null;

  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-[var(--ai-border)] bg-[var(--ai-bg)] mt-24"
      role="contentinfo"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          {/* Colonne 1 : marque */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/ai" className="flex items-baseline gap-1.5 mb-4">
              <span className="text-xl font-bold tracking-tight text-[var(--ai-text)]">
                Workwave
              </span>
              <span className="text-[13px] font-medium text-[var(--ai-accent)]">
                freelances
              </span>
            </Link>
            <p className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed">
              Trouvez le freelance idéal pour vos projets : IA, développement
              web, data, design, marketing, rédaction, audiovisuel et plus.
            </p>
          </div>

          {/* Colonne 2 : clients */}
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
                <Link href="/ai/freelances" className="hover:text-[var(--ai-text)] transition-colors">
                  Trouver un freelance
                </Link>
              </li>
              <li>
                <Link href="/ai/projets" className="hover:text-[var(--ai-text)] transition-colors">
                  Projets en ligne
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : freelances */}
          <div>
            <p className="text-[11px] font-semibold text-[var(--ai-text-tertiary)] uppercase tracking-wider mb-3">
              Freelances
            </p>
            <ul className="space-y-2 text-[13px] text-[var(--ai-text-secondary)]">
              <li>
                <Link href="/ai/pour-les-freelances" className="hover:text-[var(--ai-text)] transition-colors">
                  Pourquoi nous rejoindre
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
        <div className="pt-8 border-t border-[var(--ai-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
