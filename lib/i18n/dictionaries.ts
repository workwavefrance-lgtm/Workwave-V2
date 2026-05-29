/**
 * Point d'entree des dictionnaires i18n Workwave AI.
 *
 * Server components : `const dict = getDictionary(locale)` puis on passe les
 * tranches utiles (dict.nav, dict.footer) en props aux composants client. On
 * evite ainsi de bundler les deux locales cote client.
 */

import type { Locale } from "./config";
import { en, type Dictionary } from "./en";
import { fr } from "./fr";

export type { Dictionary };

export function getDictionary(locale: Locale): Dictionary {
  return locale === "en" ? en : fr;
}
