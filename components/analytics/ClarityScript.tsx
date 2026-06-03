"use client";

import { useEffect } from "react";

// Microsoft Clarity (enregistrements de session + heatmaps) — projet workwave.fr.
// RGPD : l'enregistrement de session est plus intrusif que de l'analytics simple,
// donc on ne charge Clarity QU'APRÈS consentement analytics (cookie
// `consent_analytics=accepted`, posé par CookieBanner) — cohérent avec /api/track.
// Clarity masque par défaut tout le contenu saisi (champs de formulaire), donc
// aucune donnée perso n'est enregistrée en clair.
const CLARITY_PROJECT_ID = "x17wn4qqqr";

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

export default function ClarityScript() {
  useEffect(() => {
    const consented = document.cookie
      .split("; ")
      .some((c) => c.trim() === "consent_analytics=accepted");
    if (!consented) return;
    if (window.clarity) return; // déjà chargé

    (function (
      c: Window & { clarity?: (...a: unknown[]) => void },
      l: Document,
      a: "clarity",
      r: "script",
      i: string
    ) {
      c[a] =
        c[a] ||
        function (...args: unknown[]) {
          (
            (c[a] as unknown as { q?: unknown[] }).q =
              (c[a] as unknown as { q?: unknown[] }).q || []
          ).push(args);
        };
      const t = l.createElement(r);
      t.async = true;
      t.src = "https://www.clarity.ms/tag/" + i;
      const y = l.getElementsByTagName(r)[0];
      y.parentNode?.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_PROJECT_ID);
  }, []);

  return null;
}
