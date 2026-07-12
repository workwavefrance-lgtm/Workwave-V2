"use client";

import { useState, useEffect } from "react";

const COOKIE_NAME = "consent_analytics";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 an

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function hasAnalyticsConsent(): boolean {
  if (typeof document === "undefined") return false;
  return getCookie(COOKIE_NAME) === "accepted";
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookie(COOKIE_NAME);
    if (!consent) setVisible(true);
  }, []);

  function pushUetConsent(state: "granted" | "denied") {
    // Propage le choix au pixel Microsoft Ads (UET) sans attendre un reload.
    // Sans ce signal, UET reste en ad_storage=denied (EEE) et les conversions
    // ne sont jamais attribuées aux clics. Cf. components/analytics/UETPixel.tsx.
    try {
      (window as unknown as { uetq?: { push: (...a: unknown[]) => void } }).uetq?.push(
        "consent",
        "update",
        { ad_storage: state }
      );
    } catch {
      /* uetq absent (tag non chargé) : le consent default lira le cookie au prochain load */
    }
  }

  function pushGoogleConsent(state: "granted" | "denied") {
    // Met à jour Google Consent Mode (GA via GTM) sans attendre un reload.
    // Le 'default' est à 'denied' (cf. app/layout.tsx) → GA ne dépose ses cookies
    // qu'après ce 'update' en 'granted'. Réplique exacte de gtag('consent',...) :
    // on pousse l'objet arguments dans dataLayer.
    try {
      const w = window as unknown as { dataLayer?: unknown[] };
      w.dataLayer = w.dataLayer || [];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      function gtag(..._args: unknown[]) {
        // eslint-disable-next-line prefer-rest-params
        (w.dataLayer as unknown[]).push(arguments);
      }
      gtag("consent", "update", {
        ad_storage: state,
        analytics_storage: state,
        ad_user_data: state,
        ad_personalization: state,
      });
    } catch {
      /* dataLayer absent : le consent default relira le cookie au prochain load */
    }
  }

  function accept() {
    setCookie(COOKIE_NAME, "accepted", COOKIE_MAX_AGE);
    pushGoogleConsent("granted");
    pushUetConsent("granted");
    setVisible(false);
  }

  function refuse() {
    setCookie(COOKIE_NAME, "refused", COOKIE_MAX_AGE);
    pushGoogleConsent("denied");
    pushUetConsent("denied");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-xs z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#27272A] rounded-xl px-3.5 py-2.5 shadow-lg flex items-center gap-2.5">
        <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] leading-snug flex-1">
          Cookies de mesure d&apos;audience et de publicité (Microsoft Ads).
        </p>
        <button
          onClick={accept}
          className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white cursor-pointer"
          style={{ backgroundColor: "#FF5A36" }}
        >
          OK
        </button>
        <button
          onClick={refuse}
          aria-label="Refuser les cookies"
          className="shrink-0 px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#0A0A0A] dark:hover:text-[#FAFAFA]"
        >
          Refuser
        </button>
      </div>
    </div>
  );
}
