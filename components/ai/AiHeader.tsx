"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Header Workwave AI — style Pixel Rise + mobile menu premium.
 *
 * Desktop (md+) :
 *   - Logo 2x2 grid orange/noir
 *   - Nav centrale pill bar avec active state pill dynamique
 *   - CTA droite : pill noir "Connexion" + switcher FR
 *
 * Mobile (< md) :
 *   - Logo + hamburger 44x44 (tap target accessible)
 *   - Overlay full-screen z-30 sous le header (z-40)
 *   - Items du menu en display ultra-bold uppercase + flèche →
 *   - Pagination [ 01 ] [ 02 ] [ 03 ] monospace sur chaque item
 *   - Body scroll lock quand open, Escape pour fermer
 */

const NAV_ITEMS = [
  { href: "/ai#methode", label: "Comment ca marche" },
  { href: "/ai/pour-les-freelances", label: "Pour freelances" },
  { href: "/ai/tarifs", label: "Tarifs" },
];

export default function AiHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Body scroll lock + Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handler);
    };
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className="sticky top-0 z-40 backdrop-blur-md bg-[var(--ai-bg)]/85 border-b border-[var(--ai-border-subtle)]"
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* Logo */}
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

          {/* Nav desktop (md+) */}
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

          {/* Actions droite */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              type="button"
              className="hidden lg:inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--ai-text-secondary)] hover:text-[var(--ai-text)] transition-colors duration-150"
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

            {/* Connexion en lien texte (md+) */}
            <Link
              href="/ai/connexion"
              className="hidden md:inline-flex items-center h-10 px-3 text-[13px] font-medium text-[var(--ai-text-secondary)] hover:text-[var(--ai-text)] transition-colors duration-150"
            >
              Connexion
            </Link>

            {/* CTA primary orange : Deposer un projet (md+) */}
            <Link
              href="/ai/deposer"
              className="hidden md:inline-flex items-center h-10 px-5 text-[13px] font-semibold rounded-full bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors duration-150"
              style={{ boxShadow: "var(--ai-shadow-sm)" }}
            >
              Deposer un projet
              <svg
                className="ml-1.5 w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            {/* Hamburger mobile (< md) — 44x44 tap target */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg text-[var(--ai-text)] hover:bg-[var(--ai-bg-subtle)] transition-colors duration-150 -mr-2"
              aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                {isOpen ? (
                  <path
                    d="M6 18L18 6M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <>
                    <path
                      d="M4 8h16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M4 16h16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay — z-30 sous header z-40 */}
      <div
        id="mobile-menu"
        className={`md:hidden fixed inset-0 z-30 bg-[var(--ai-bg)] transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <div
          className={`h-full overflow-y-auto px-4 sm:px-6 pb-12 pt-24 transition-transform duration-300 ease-out ${
            isOpen ? "translate-y-0" : "-translate-y-4"
          }`}
        >
          {/* Pagination header */}
          <div className="flex items-center gap-4 mb-10">
            <span
              className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)]"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              [ MENU ]
            </span>
            <span className="h-px flex-1 bg-[var(--ai-border)]" />
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-accent)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
              Workwave AI
            </span>
          </div>

          {/* Nav items en display bold */}
          <nav aria-label="Menu mobile">
            <ul>
              {NAV_ITEMS.map((item, i) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between py-5 border-b border-[var(--ai-border-subtle)] transition-colors group ${
                        isActive
                          ? "text-[var(--ai-text)]"
                          : "text-[var(--ai-text)] hover:text-[var(--ai-accent)]"
                      }`}
                    >
                      <span className="flex items-center gap-5">
                        <span
                          className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)]"
                          style={{
                            fontFamily: "var(--font-geist-mono), monospace",
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className="font-black uppercase tracking-tight"
                          style={{
                            fontSize: "clamp(28px, 9vw, 44px)",
                            lineHeight: 1,
                            letterSpacing: "-0.03em",
                          }}
                        >
                          {item.label}
                        </span>
                      </span>
                      <svg
                        className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 12h14M13 6l6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* CTAs */}
          <div className="mt-10 space-y-3">
            <Link
              href="/ai/deposer"
              className="flex items-center justify-center h-12 px-6 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
              style={{ boxShadow: "var(--ai-shadow-sm)" }}
            >
              Deposer un projet
              <svg
                className="ml-2 w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="/ai/connexion"
              className="flex items-center justify-center h-12 px-6 text-[14px] font-semibold rounded-lg bg-[var(--ai-text)] hover:bg-[#1F1F1F] text-white transition-colors"
            >
              Connexion / Inscription
            </Link>
          </div>

          {/* Footer mobile menu */}
          <div className="mt-12 pt-8 border-t border-[var(--ai-border-subtle)]">
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--ai-text-secondary)] hover:text-[var(--ai-text)] transition-colors"
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
                FR · Francais
              </button>
            </div>
            <Link
              href="/"
              className="block text-[12px] text-[var(--ai-text-tertiary)] hover:text-[var(--ai-text)] transition-colors"
            >
              Vous cherchez un artisan BTP ?{" "}
              <span className="underline decoration-[var(--ai-border)] underline-offset-2 font-medium">
                workwave.fr
              </span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
