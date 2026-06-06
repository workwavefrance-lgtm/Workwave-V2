"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Microsoft Advertising Universal Event Tracking (UET) pixel.
 *
 * - Charge bat.js avec le tag ID (NEXT_PUBLIC_UET_TAG_ID) au 1er render.
 * - Détecte la page /deposer-projet/merci → push un événement de conversion
 *   "submit_lead" avec une valeur de 9,90 EUR (revenue pay-per-lead unlock).
 * - Aucun effet si la var d'env n'est pas définie (skip propre en dev local).
 *
 * Pourquoi ce composant et pas la balise UET copiée telle quelle :
 *  - Détection automatique de la page de conversion (pas besoin de modifier
 *    /deposer-projet/merci/page.tsx).
 *  - Compatible Next.js App Router : usePathname + useEffect pour push d'event
 *    quand le pathname change (navigation client-side).
 *  - Type-safe + commentaires (vs blob de code copié).
 *
 * Mode consentement RGPD non activé pour l'instant (workwave.fr a déjà GTM-W65L4PJD
 * pour GA4 qui gère la conformité globale). À activer si Microsoft Ads impose un
 * mode strict EEE.
 */
type UETQueue = unknown[] & { push: (event: unknown) => void };
declare global {
  interface Window {
    uetq?: UETQueue;
    UET?: new (options: unknown) => UETQueue;
  }
}

const TAG_ID = process.env.NEXT_PUBLIC_UET_TAG_ID;

export default function UETPixel() {
  const pathname = usePathname();

  // Conversion : déclenche dès qu'on atterrit sur la page merci.
  useEffect(() => {
    if (!TAG_ID) return;
    if (typeof window === "undefined") return;
    if (pathname !== "/deposer-projet/merci") return;

    // Sécurité : attendre que window.uetq existe (script chargé).
    function pushConversion() {
      if (!window.uetq) return;

      // Enhanced Conversions Microsoft Ads : avant le push de conversion, on
      // passe l'email et le téléphone de l'utilisateur stockés en sessionStorage
      // par <ProjectForm> au moment du submit. MS Ads les hashera côté serveur
      // (SHA-256) puis matchera cross-device (= +15-30% précision matching).
      // Cleanup auto après lecture pour éviter de re-pousser sur navigation.
      try {
        const em = sessionStorage.getItem("wwv:uet_em");
        const ph = sessionStorage.getItem("wwv:uet_ph");
        if (em || ph) {
          const pid: { em?: string; ph?: string } = {};
          if (em) pid.em = em;
          if (ph) pid.ph = ph;
          window.uetq.push("set", { pid });
          sessionStorage.removeItem("wwv:uet_em");
          sessionStorage.removeItem("wwv:uet_ph");
        }
      } catch {
        /* sessionStorage indisponible (mode privé Safari), pas critique */
      }

      window.uetq.push({
        ec: "Lead",
        ea: "submit_lead",
        el: "Dépôt de projet",
        ev: 9.9,
        gv: 9.9,
        gc: "EUR",
      });
    }

    if (window.uetq) {
      pushConversion();
    } else {
      // Polling court (max ~3s) pour attendre l'init UET
      let tries = 0;
      const id = setInterval(() => {
        tries++;
        if (window.uetq) {
          pushConversion();
          clearInterval(id);
        } else if (tries > 30) {
          clearInterval(id);
        }
      }, 100);
      return () => clearInterval(id);
    }
  }, [pathname]);

  if (!TAG_ID) return null;

  // Script UET officiel Microsoft Ads. enableAutoSpaTracking=true → reconnaît
  // automatiquement les changements de route Next.js sans event manuel.
  return (
    <Script
      id="msft-uet"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(w, d, t, u, o) {
            w[u] = w[u] || [], o.ts = (new Date).getTime();
            var n = d.createElement(t);
            n.src = "https://bat.bing.net/bat.js?ti=" + o.ti + ("uetq" != u ? "&q=" + u : "");
            n.async = 1;
            n.onload = n.onreadystatechange = function() {
              var s = this.readyState;
              if (s && "loaded" !== s && "complete" !== s) return;
              o.q = w[u], w[u] = new w.UET(o), w[u].push("pageLoad");
              n.onload = n.onreadystatechange = null;
            };
            var i = d.getElementsByTagName(t)[0];
            i.parentNode.insertBefore(n, i);
          })(window, document, "script", "uetq", {
            ti: "${TAG_ID}",
            enableAutoSpaTracking: true
          });
        `,
      }}
    />
  );
}
