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
 * sens.
 *
 * Version 2 (02/09, 13 h) : la version 1 acceptait aussi « 4 secondes d'onglet
 * visible » comme signe de vie. Mesure apres deploiement : 192 vues pour 191
 * sessions en 10 min, toutes 1920x1080 Chrome, une page chacune. Un navigateur
 * sans fenetre se declare « visible » et attend volontiers 4 secondes. Le
 * temps de presence ne distingue donc rien ; seule une INTERACTION compte
 * (souris, defilement, toucher, clavier, clic). Un humain qui lit fait au
 * moins l'un des quatre ; un aspirateur, en principe, aucun.
 *
 * Le script Umami est charge avec data-auto-track="false" (app/layout.tsx) ;
 * c'est ce composant qui declenche umami.track() une fois par page, au premier
 * signe, et a chaque changement de page de l'application. Le nom du signe est
 * envoye en evenement separe (« signe ») pour verifier en base ce qui declenche
 * reellement les vues ; a retirer une fois la mesure faite.
 */
declare global {
  interface Window {
    umami?: { track: (nom?: string, donnees?: Record<string, string>) => void };
  }
}

const SIGNES = ["pointermove", "scroll", "touchstart", "keydown", "click"] as const;

export default function UmamiHumain() {
  const pathname = usePathname();

  useEffect(() => {
    // Navigateur pilote par un automate (Puppeteer, Playwright, Selenium) :
    // jamais un visiteur. Les outils furtifs le masquent, mais ca en ecarte
    // une partie sans rien couter.
    if (navigator.webdriver) return;

    let fait = false;

    const envoyer = (e: Event) => {
      if (fait) return;
      fait = true;
      SIGNES.forEach((s) => window.removeEventListener(s, envoyer));
      // Le script peut ne pas etre encore charge : on retente brievement.
      let essais = 0;
      const tenter = () => {
        if (window.umami) {
          window.umami.track();
          window.umami.track("signe", { type: e.type });
        } else if (essais++ < 10) setTimeout(tenter, 500);
      };
      tenter();
    };

    SIGNES.forEach((s) => window.addEventListener(s, envoyer, { passive: true }));

    return () => {
      SIGNES.forEach((s) => window.removeEventListener(s, envoyer));
    };
  }, [pathname]);

  return null;
}
