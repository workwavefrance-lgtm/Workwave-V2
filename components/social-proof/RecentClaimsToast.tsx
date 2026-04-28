"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

// Affiche une discrete notification "social proof" en bas-gauche du site
// (bas-centre sur mobile) : "X vient de rejoindre Workwave".
// Les pros listes sont publics (deja sur /artisan/[slug] + registre Sirene).
//
// Cadence :
//   - Premiere notif apres 12s (laisser la page se charger / ne pas
//     spammer l'utilisateur des l'arrivee)
//   - Une notif toutes les 45s ensuite
//   - Visible 7s puis disparait (slide-out)
//   - Max 4 notifs par session (sessionStorage)
//
// Ne s'affiche pas :
//   - Sur les routes admin / dashboard pro / login pro (cf. layout filtre)
//   - Si l'utilisateur a ferme une notif manuellement (preference 1h)

type Item = {
  slug: string;
  name: string;
  category: string | null;
  city: string | null;
  claimed_at: string;
};

const SESSION_LIMIT = 4;
const SESSION_KEY_COUNT = "wwv:rcl:count";
const SESSION_KEY_DISMISSED_UNTIL = "wwv:rcl:dismissed_until";
const FIRST_DELAY_MS = 12_000;
const INTERVAL_MS = 45_000;
const VISIBLE_MS = 7_000;
const ANIM_MS = 320;

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMin = Math.max(1, Math.round((now - then) / 60_000));
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  if (diffD === 1) return "hier";
  if (diffD < 7) return `il y a ${diffD} jours`;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
}

export default function RecentClaimsToast() {
  const [items, setItems] = useState<Item[]>([]);
  const [current, setCurrent] = useState<Item | null>(null);
  const [visible, setVisible] = useState(false);

  // Fetch les claims publics au mount, en differant pour ne pas
  // bloquer le LCP de la page.
  useEffect(() => {
    let cancelled = false;
    const tid = setTimeout(async () => {
      try {
        const res = await fetch("/api/recent-claims", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;
        const json = (await res.json()) as { items: Item[] };
        if (!cancelled && Array.isArray(json.items) && json.items.length > 0) {
          // Shuffle l'ordre pour varier d'une visite a l'autre
          const shuffled = [...json.items].sort(() => Math.random() - 0.5);
          setItems(shuffled);
        }
      } catch {
        // silent fail : pas de social proof = pas de probleme
      }
    }, 4_000);
    return () => {
      cancelled = true;
      clearTimeout(tid);
    };
  }, []);

  const tryShowNext = useCallback(() => {
    if (typeof window === "undefined") return;
    if (items.length === 0) return;

    // Limite par session
    const count = parseInt(sessionStorage.getItem(SESSION_KEY_COUNT) ?? "0", 10);
    if (count >= SESSION_LIMIT) return;

    // Respect de l'opt-out (fermeture manuelle = silence pendant 1h)
    const dismissedUntil = parseInt(
      sessionStorage.getItem(SESSION_KEY_DISMISSED_UNTIL) ?? "0",
      10
    );
    if (dismissedUntil && Date.now() < dismissedUntil) return;

    // Choisir un item au hasard parmi les 50
    const next = items[Math.floor(Math.random() * items.length)];
    setCurrent(next);
    requestAnimationFrame(() => setVisible(true));
    sessionStorage.setItem(SESSION_KEY_COUNT, String(count + 1));
  }, [items]);

  const hide = useCallback(() => {
    setVisible(false);
    setTimeout(() => setCurrent(null), ANIM_MS);
  }, []);

  // Programme l'apparition periodique des notifs
  useEffect(() => {
    if (items.length === 0) return;

    const firstTimer = setTimeout(() => {
      tryShowNext();
      const visibleTimer = setTimeout(hide, VISIBLE_MS);
      return () => clearTimeout(visibleTimer);
    }, FIRST_DELAY_MS);

    const interval = setInterval(() => {
      tryShowNext();
      setTimeout(hide, VISIBLE_MS);
    }, INTERVAL_MS);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, [items, tryShowNext, hide]);

  const dismiss = () => {
    sessionStorage.setItem(
      SESSION_KEY_DISMISSED_UNTIL,
      String(Date.now() + 60 * 60 * 1000) // 1h de silence
    );
    hide();
  };

  if (!current) return null;

  const label = [current.category, current.city].filter(Boolean).join(" · ");

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "fixed z-40 pointer-events-none",
        "left-4 right-4 bottom-4 sm:left-6 sm:right-auto sm:bottom-6",
        "sm:max-w-[340px]",
        "transition-all duration-300 ease-out",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-3",
      ].join(" ")}
    >
      <div className="pointer-events-auto bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#27272A] rounded-2xl shadow-lg p-3 pr-2 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#FF5A36]/10 flex items-center justify-center shrink-0">
          <svg
            className="w-4 h-4 text-[#FF5A36]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href={`/artisan/${current.slug}`}
            className="block text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA] truncate hover:text-[#FF5A36] transition-colors"
          >
            {current.name}
          </Link>
          {label && (
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 truncate">
              {label}
            </p>
          )}
          <p className="text-[11px] text-[#9CA3AF] dark:text-[#6B7280] mt-1">
            vient de rejoindre Workwave · {formatRelative(current.claimed_at)}
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer la notification"
          className="text-[#9CA3AF] hover:text-[#0A0A0A] dark:hover:text-[#FAFAFA] transition-colors p-1 -mt-1 -mr-1 shrink-0"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
