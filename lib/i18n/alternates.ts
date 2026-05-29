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

export function aiAlternates({
  fr,
  en,
  current,
}: AlternatesInput): NonNullable<Metadata["alternates"]> {
  return {
    canonical: current === "en" ? abs(en) : abs(fr),
    languages: {
      "fr-FR": abs(fr),
      en: abs(en),
      "x-default": abs(en),
    },
  };
}
