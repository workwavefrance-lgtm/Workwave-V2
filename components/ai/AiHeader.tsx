"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Header du vertical freelance (/ai/*) — unifié avec workwave.fr.
 *
 * Depuis le 28/06/2026 : même identité visuelle que le site principal
 * (wordmark "Workwave", accent coral, style sobre). Le vertical freelance
 * est désormais une section normale de workwave.fr, plus une marque à part.
 *
 * FR uniquement (l'EN international /en/ai est en pause + redirigé).
 * Caché sur /ai/dashboard (il a sa propre sidebar).
 */

const NAV_ITEMS = [
  { href: "/ai/deposer", label: "Déposer un projet" },
  { href: "/ai/projets", label: "Projets en ligne" },
  { href: "/ai/pour-les-freelances", label: "Pour les freelances" },
  { href: "/ai/tarifs", label: "Tarifs" },
];

export default function AiHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Caché sur le dashboard freelance (sidebar dédiée).
  if (pathname.startsWith("/ai/dashboard")) return null;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--ai-bg)]/85 backdrop-blur-lg border-b border-[var(--ai-border)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-[72px] flex items-center justify-between gap-3">
        {/* Logo wordmark — identique au site principal + tag section */}
        <Link
          href="/ai"
          className="flex items-baseline gap-1.5 flex-shrink-0"
          aria-label="Workwave — Freelances & services digitaux"
        >
          <span className="text-xl font-bold tracking-tight text-[var(--ai-text)]">
            Workwave
          </span>
          <span className="text-[13px] font-medium text-[var(--ai-accent)]">
            freelances
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-7 text-sm">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors duration-250 link-underline ${
                  isActive
                    ? "text-[var(--ai-text)] font-medium"
                    : "text-[var(--ai-text-secondary)] hover:text-[var(--ai-text)]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/ai/connexion"
            className="text-sm text-[var(--ai-text-secondary)] hover:text-[var(--ai-text)] link-underline transition-colors duration-250"
          >
            Connexion
          </Link>
          <Link
            href="/ai/deposer"
            className="bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
          >
            Déposer un projet
          </Link>
        </div>

        {/* Mobile : CTA + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/ai/deposer"
            className="bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white px-4 py-2 rounded-full text-xs font-semibold transition-all duration-250"
          >
            Déposer
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--ai-bg-subtle)] transition-colors duration-250 text-[var(--ai-text)]"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              className="w-5 h-5"
            >
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-[var(--ai-border)] bg-[var(--ai-bg)] px-4 pb-6 pt-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block py-3 text-[var(--ai-text)] font-medium"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/ai/connexion"
            onClick={() => setMenuOpen(false)}
            className="block py-3 text-[var(--ai-text)] font-medium"
          >
            Connexion
          </Link>
          <Link
            href="/ai/deposer"
            onClick={() => setMenuOpen(false)}
            className="block mt-4 bg-[var(--ai-accent)] text-white text-center px-5 py-3 rounded-full text-sm font-semibold"
          >
            Déposer un projet
          </Link>
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="block pt-4 text-[13px] text-[var(--ai-text-tertiary)] hover:text-[var(--ai-text)] transition-colors"
          >
            Vous cherchez un artisan BTP ?{" "}
            <span className="font-medium underline underline-offset-2">workwave.fr</span>
          </Link>
        </nav>
      )}
    </header>
  );
}
