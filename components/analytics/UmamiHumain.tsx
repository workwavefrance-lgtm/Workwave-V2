"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Umami n'enregistre une vue qu'apres un signe de vie humain.
 *
 * Pourquoi (02/09/2026) : les aspirateurs qui pompent le site (98 % du trafic,
 * signatures Chrome, navigateurs sans fenetre) EXECUTENT le JavaScript. Dix
 * minutes apres la pose du compteur : 77 vues, 77 sessions, une page chacune.
 * Compter ca comme des visiteurs rendrait Umami aussi faux que GA4, dans l'autre
 * sens. Un humain fait defiler, bouge la souris, touche l'ecran, ou reste au
 * moins quelques secondes. Un aspirateur prend le HTML et repart sous la
 * seconde sans jamais interagir.
 *
 * Le script Umami est charge avec data-auto-track="false" (app/layout.tsx) ;
 * c'est ce composant qui declenche umami.track() une fois par page, au premier
 * signe de vie ou apres 4 s de presence onglet visible, et a chaque changement
 * de page de l'application.
 */
declare global {
  interface Window {
    umami?: { track: () => void };
  }
}

const SIGNES = ["pointermove", "scroll", "touchstart", "keydown", "click"] as const;

export default function UmamiHumain() {
  const pathname = usePathname();

  useEffect(() => {
    let fait = false;
    let minuterie: ReturnType<typeof setTimeout> | null = null;

    const envoyer = () => {
      if (fait) return;
      fait = true;
      SIGNES.forEach((s) => window.removeEventListener(s, envoyer));
      if (minuterie) clearTimeout(minuterie);
      // Le script peut ne pas etre encore charge : on retente brievement.
      let essais = 0;
      const tenter = () => {
        if (window.umami) window.umami.track();
        else if (essais++ < 10) setTimeout(tenter, 500);
      };
      tenter();
    };

    SIGNES.forEach((s) => window.addEventListener(s, envoyer, { passive: true, once: true }));
    // Presence : 4 s avec l'onglet visible suffit (lecture sans interaction).
    const armer = () => {
      if (document.visibilityState === "visible" && !minuterie) minuterie = setTimeout(envoyer, 4000);
    };
    armer();
    document.addEventListener("visibilitychange", armer);

    return () => {
      SIGNES.forEach((s) => window.removeEventListener(s, envoyer));
      document.removeEventListener("visibilitychange", armer);
      if (minuterie) clearTimeout(minuterie);
    };
  }, [pathname]);

  return null;
}
