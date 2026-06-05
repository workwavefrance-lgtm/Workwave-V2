"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Bar fine en TOP qui apparait au scroll (~700px) sur les pages
 * listing /[metier]/[location]. Capture du lead persistante pendant
 * que l'user parcourt la liste/FAQ/internal links.
 *
 * Disparait si l'user clique X (sessionStorage par url).
 */
export default function StickyProjectCTA({
  categorySlug,
  categoryName,
  citySlug,
  locationName,
  preposition,
  specialitySlug,
  tagline = "Recevez 3 devis gratuits en 30 sec.",
  ctaText = "Demander un devis",
}: {
  categorySlug: string;
  categoryName: string;
  citySlug: string | null;
  locationName: string;
  preposition: string;
  /** Sous-specialite si on est sur /[metier]/[specialite]/[ville] */
  specialitySlug?: string | null;
  /** Wording personnalisable (ex. guides des prix : "Déposez votre projet"). */
  tagline?: string;
  ctaText?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  // Clef sessionStorage par couple (categorie, specialite, ville) — si l'user
  // dismiss le sticky sur /plombier/depannage/poitiers, ca ne le dismiss pas
  // pour /plombier/poitiers ou /plombier/fuite/poitiers.
  const storageKey = `wwv:sticky_dismissed:${categorySlug}:${specialitySlug ?? "all"}:${citySlug ?? "dept"}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setDismissed(sessionStorage.getItem(storageKey) === "1");
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (dismissed !== false) return;
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setVisible(window.scrollY > 700);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    // Premier check (cas page deja scrollee a l'arrivee)
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed]);

  function handleDismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // ignore quota
    }
  }

  if (dismissed === null || dismissed) return null;

  const projectParams = new URLSearchParams();
  projectParams.set("categorie", categorySlug);
  if (citySlug) projectParams.set("ville", citySlug);
  if (specialitySlug) projectParams.set("specialite", specialitySlug);
  const projectHref = `/deposer-projet?${projectParams.toString()}`;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        visible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "-translate-y-full opacity-0 pointer-events-none"
      }`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div
        className="bg-white dark:bg-[#0F0F0F] border-b border-[#E5E7EB] dark:border-[#27272A]"
        style={{ boxShadow: "0 4px 16px -4px rgba(15, 23, 42, 0.08)" }}
      >
        {/* Liseré coral subtil en haut */}
        <div
          className="h-[2px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #FF5A36 25%, #FF7A5C 50%, #FF5A36 75%, transparent 100%)",
          }}
        />
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <p className="flex-1 min-w-0 text-[13px] sm:text-[14px] text-[var(--text-primary)] leading-tight">
            <span className="hidden sm:inline font-semibold">
              {categoryName} {preposition} {locationName} ?
            </span>{" "}
            <span className="text-[var(--text-secondary)]">
              {tagline}
            </span>
          </p>
          <Link
            href={projectHref}
            className="inline-flex items-center justify-center h-9 px-4 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-semibold transition-all duration-200 hover:scale-105 shrink-0"
            style={{ boxShadow: "0 2px 8px -2px rgba(255, 90, 54, 0.4)" }}
          >
            {ctaText}
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fermer la barre"
            className="text-[#9CA3AF] hover:text-[var(--text-primary)] p-1 rounded transition-colors duration-150 shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
