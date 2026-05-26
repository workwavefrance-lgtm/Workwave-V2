"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Sticky CTA bottom barre pour toutes les pages /ai/*.
 *
 * Comportement :
 *   - Cachee sur la 1er viewport (l'user voit deja le hero CTA)
 *   - Apparait apres scroll de ~500px (slide-up animation 300ms)
 *   - Cachee sur les pages ou ca derangerait :
 *     /ai/deposer (form sensitive)
 *     /ai/deposer/succes (confirmation page)
 *     /ai/connexion (form)
 *     /ai/inscription (form)
 *   - Dismissable via X (localStorage pour ne plus l'afficher 7 jours)
 *   - Pleine largeur mobile, max-w-3xl + centered desktop
 *
 * Design : reprend le pattern composite CTA bar des landings + plus
 * gros + plus visible (background blanc, shadow lg, accent orange).
 */

const HIDDEN_PATHS = [
  "/ai/deposer",
  "/ai/deposer/succes",
  "/ai/connexion",
  "/ai/inscription",
  "/ai/dashboard",
];

const DISMISS_KEY = "ai-sticky-cta-dismissed";
const DISMISS_DAYS = 7;

export default function AiStickyCta() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Hide on form pages
  const shouldHide = HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    if (shouldHide) return;

    // Check dismiss flag
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const dismissedAt = parseInt(raw, 10);
        const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
        if (daysSince < DISMISS_DAYS) {
          setDismissed(true);
          return;
        }
      }
    } catch {}

    // Show after scroll past first viewport
    const onScroll = () => {
      setVisible(window.scrollY > 500);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [shouldHide, pathname]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setDismissed(true);
  };

  if (shouldHide || dismissed) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-30 pointer-events-none transition-all duration-300 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-6 pb-3 sm:pb-5">
        <div
          className="pointer-events-auto group flex items-stretch bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-xl overflow-hidden relative"
          style={{ boxShadow: "var(--ai-shadow-lg)" }}
        >
          {/* Dismiss button (top-right) */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-md text-[var(--ai-text-tertiary)] hover:text-[var(--ai-text)] hover:bg-[var(--ai-bg-subtle)] transition-colors z-10"
            aria-label="Fermer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <Link
            href="/ai/deposer"
            className="flex flex-1 items-stretch"
          >
            {/* Hint text (left) */}
            <div className="flex-1 flex items-center gap-3 px-4 sm:px-5 py-4 sm:py-5 min-w-0">
              <div
                className="grid grid-cols-2 grid-rows-2 gap-[2px] w-6 h-6 flex-shrink-0 transition-transform duration-200 group-hover:rotate-90"
                aria-hidden="true"
              >
                <div className="bg-[var(--ai-accent)] rounded-[1.5px]" />
                <div className="bg-[var(--ai-text)] rounded-[1.5px]" />
                <div className="bg-[var(--ai-text)] rounded-[1.5px]" />
                <div className="bg-[var(--ai-accent)] rounded-[1.5px]" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] sm:text-[15px] font-semibold text-[var(--ai-text)] truncate">
                  Trouvez le freelance ideal
                </p>
                <p className="text-[12px] text-[var(--ai-text-secondary)] truncate hidden sm:block">
                  Matching IA en moins de 24h · gratuit · sans credit
                </p>
              </div>
            </div>

            {/* Orange CTA (right) */}
            <div className="flex items-center justify-center gap-2 bg-[var(--ai-accent)] group-hover:bg-[var(--ai-accent-hover)] text-white px-5 sm:px-7 transition-colors duration-200">
              <span className="text-[14px] sm:text-[15px] font-semibold whitespace-nowrap tracking-tight">
                Deposer un projet
              </span>
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
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
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
