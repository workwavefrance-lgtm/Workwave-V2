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

  function accept() {
    setCookie(COOKIE_NAME, "accepted", COOKIE_MAX_AGE);
    pushUetConsent("granted");
    setVisible(false);
  }

  function refuse() {
    setCookie(COOKIE_NAME, "refused", COOKIE_MAX_AGE);
    pushUetConsent("denied");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-white dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#27272A] rounded-2xl p-4 shadow-lg">
        <p className="text-sm text-[#0A0A0A] dark:text-[#FAFAFA] mb-1 font-medium">
          Cookies analytiques
        </p>
        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-3 leading-relaxed">
          Nous utilisons des cookies pour analyser le trafic, mesurer nos
          campagnes publicitaires (Microsoft Advertising) et améliorer votre
          expérience.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={accept}
            className="flex-1 px-3 py-2 rounded-xl text-xs font-medium text-white transition-colors duration-200 cursor-pointer"
            style={{ backgroundColor: "#FF5A36" }}
          >
            Accepter
          </button>
          <button
            onClick={refuse}
            className="flex-1 px-3 py-2 rounded-xl text-xs font-medium border transition-colors duration-200 cursor-pointer text-[#6B7280] dark:text-[#9CA3AF] border-[#E5E7EB] dark:border-[#27272A] hover:bg-[#FAFAFA] dark:hover:bg-[#1A1A1A]"
          >
            Refuser
          </button>
        </div>
      </div>
    </div>
  );
}
