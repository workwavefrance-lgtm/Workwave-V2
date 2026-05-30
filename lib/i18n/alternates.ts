/**
 * Helper hreflang / canonical pour Workwave AI bilingue (FR + EN).
 *
 * REGLE SEO (garde-fou CLAUDE.md) : hreflang DOIT etre reciproque, sinon Google
 * l'ignore. Chaque page FR pointe vers son equivalent EN et vice-versa, avec un
 * x-default. On dirige x-default vers la version EN (internationale) pour capter
 * le trafic non-francophone (UK, Golfe, Europe, Afrique anglophone).
 *
 * Usage dans une page :
 *   export const metadata = {
 *     alternates: aiAlternates({ fr: "/ai", en: "/en/ai", current: "fr" }),
 *   };
 */

import type { Metadata } from "next";
import type { Locale } from "./config";
import { BASE_URL } from "@/lib/constants";

type AlternatesInput = {
  /** Chemin FR (ex. "/ai", "/ai/developpement-web/dubai"). */
  fr: string;
  /** Chemin EN equivalent (ex. "/en/ai", "/en/ai/web-development/dubai"). */
  en: string;
  /** Locale de la page courante (definit le canonical). */
  current: Locale;
};

function abs(path: string): string {
  return `${BASE_URL}${path}`;
}

// Le contenu EN international est hébergé sur le gTLD workwaveai.co (cf.
// next.config.ts : workwave.fr/en/ai/* redirige 301 vers ce domaine). Donc le
// canonical + hreflang des pages EN pointent sur le .co, pas sur le .fr
// (un gTLD ranke à l'international, un .fr est géo-ciblé France).
const AI_EN_BASE = "https://www.workwaveai.co";
function absEn(path: string): string {
  return `${AI_EN_BASE}${path}`;
}

export function aiAlternates({
  fr,
  en,
  current,
}: AlternatesInput): NonNullable<Metadata["alternates"]> {
  return {
    canonical: current === "en" ? absEn(en) : abs(fr),
    languages: {
      "fr-FR": abs(fr),
      en: absEn(en),
      "x-default": absEn(en),
    },
  };
}

/**
 * Pages EN-only (sans équivalent FR) : pages programmatiques internationales
 * (/en/ai/[skill]/[city], hubs). hreflang en + x-default => self.
 */
export function aiAlternatesEnOnly(
  enPath: string
): NonNullable<Metadata["alternates"]> {
  return {
    canonical: absEn(enPath),
    languages: {
      en: absEn(enPath),
      "x-default": absEn(enPath),
    },
  };
}
