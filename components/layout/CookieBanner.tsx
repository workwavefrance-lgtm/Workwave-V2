"use client";

import { clearAcquisition } from "@/lib/analytics/acquisition-client";
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
    window.dispatchEvent(new Event("ww-consent-change"));
    setVisible(false);
  }

  function refuse() {
    setCookie(COOKIE_NAME, "refused", COOKIE_MAX_AGE);
    pushGoogleConsent("denied");
    clearAcquisition();
    window.dispatchEvent(new Event("ww-consent-change"));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-xs z-50 animate-in slide-in-from-bottom-4">
      {/* Thème verre : le bandeau se pose sur la page au lieu de la trancher.
          Les classes `dark:` ont été retirées le 20/09/2026 : les pages
          publiques sont claires par construction, et le bandeau s'affichait
          en noir chez un visiteur dont le système est en mode sombre. */}
      <div
        className="backdrop-blur-md border border-white rounded-[18px] px-3.5 py-2.5 flex items-center gap-2.5"
        style={{
          background: "rgba(255, 255, 255, 0.86)",
          boxShadow: "0 14px 34px -10px rgba(36, 57, 67, 0.20)",
        }}
      >
        <p className="text-[11px] text-[#5c7078] leading-snug flex-1">
          Cookies de mesure d&apos;audience.
        </p>
        <button
          onClick={accept}
          className="shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold text-white cursor-pointer transition-transform duration-200 hover:scale-[1.03]"
          style={{
            background: "linear-gradient(135deg, #ef6426, #bd4214)",
            border: "1px solid #e89977",
            boxShadow: "inset 0 2px 2px rgba(255, 255, 255, 0.4)",
          }}
        >
          OK
        </button>
        <button
          onClick={refuse}
          aria-label="Refuser les cookies"
          className="shrink-0 px-2 py-1.5 rounded-full text-[11px] font-medium cursor-pointer text-[#7d919a] hover:text-[#243036] transition-colors"
        >
          Refuser
        </button>
      </div>
    </div>
  );
}
