"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Header Workwave AI — style Pixel Rise (open source, validé par Willy 25/05).
 *
 * Patterns Pixel Rise repris :
 *   - Logo en grille 2x2 (orange + noir diagonale) = signature brand distincte
 *   - Nav centrale en "pill bar" avec background subtle + active state pill
 *   - CTA droite : pill noir "Connexion" style Login/Register
 *   - Switcher de langue avec icone globe (FR par defaut)
 *   - Sticky + backdrop blur subtle au scroll
 *
 * Aucune coral, zero header BTP. Scope visuel 100% /ai.
 */

const NAV_ITEMS = [
  { href: "/ai", label: "Trouver" },
  { href: "/ai/pour-les-freelances", label: "Freelances" },
  { href: "/ai/tarifs", label: "Tarifs" },
];

export default function AiHeader() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md bg-[var(--ai-bg)]/85 border-b border-[var(--ai-border-subtle)]"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo : grille 2x2 orange/noir + wordmark */}
        <Link
          href="/ai"
          className="flex items-center gap-2.5 flex-shrink-0 group"
          aria-label="Workwave AI — Accueil"
        >
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
            Workwave{" "}
            <span className="font-medium text-[var(--ai-text-tertiary)]">
              AI
            </span>
          </span>
        </Link>

        {/* Nav centrale : pill bar avec active state */}
        <nav
          className="hidden md:flex items-center gap-1 bg-[var(--ai-bg-card)] rounded-full p-1 border border-[var(--ai-border-subtle)]"
          style={{ boxShadow: "var(--ai-shadow-sm)" }}
          aria-label="Navigation principale"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-1.5 text-[13px] font-medium rounded-full transition-all duration-150 ${
                  isActive
                    ? "bg-[var(--ai-bg-subtle)] text-[var(--ai-text)]"
                    : "text-[var(--ai-text-secondary)] hover:text-[var(--ai-text)]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions droite : globe FR + CTA Connexion noir */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--ai-text-secondary)] hover:text-[var(--ai-text)] transition-colors duration-150"
            aria-label="Changer de langue"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M2 12h20"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            FR
          </button>
          <Link
            href="/ai/connexion"
            className="inline-flex items-center h-10 px-5 text-[13px] font-semibold rounded-full bg-[var(--ai-text)] hover:bg-[#1F1F1F] text-white transition-colors duration-150"
          >
            Connexion
          </Link>
        </div>
      </div>
    </header>
  );
}
