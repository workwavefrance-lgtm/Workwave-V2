/**
 * Config i18n Workwave AI.
 *
 * Le vertical BTP (workwave.fr/*) reste 100% francais et n'utilise PAS ce
 * module. Seul Workwave AI s'internationalise :
 *   - FR  : routes /ai/*       (route group app/(ai))
 *   - EN  : routes /en/ai/*    (route group app/(ai-en))
 *
 * Phase 1 : pages publiques indexables uniquement (pas de dashboard/auth EN),
 * donc le middleware reste inchange (cf. CLAUDE.md regle 26/05).
 */

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Prefixe d'URL par locale pour le vertical AI.
 *   fr -> "/ai"
 *   en -> "/en/ai"
 */
export function aiBasePath(locale: Locale): string {
  return locale === "en" ? "/en/ai" : "/ai";
}

/**
 * Localise un chemin AI canonique (exprime en FR, ex. "/ai/deposer") vers la
 * locale cible. "/ai/deposer" + en -> "/en/ai/deposer".
 */
export function localizeAiPath(frPath: string, locale: Locale): string {
  if (locale === "fr") return frPath;
  if (frPath === "/ai") return "/en/ai";
  if (frPath.startsWith("/ai/")) return `/en${frPath}`;
  return frPath;
}

/**
 * Bascule le chemin courant vers l'autre locale. Utilise par le switcher de
 * langue du header. En Phase 1, seule la home existe en EN : on retombe donc
 * sur la home de la locale cible si le chemin n'a pas d'equivalent direct.
 */
export function switchLocalePath(pathname: string, target: Locale): string {
  if (target === "fr") {
    // EN -> FR : on retire le prefixe /en
    if (pathname === "/en/ai" || pathname === "/en/ai/") return "/ai";
    if (pathname.startsWith("/en/ai/")) return pathname.replace(/^\/en/, "");
    return "/ai";
  }
  // FR -> EN : seule la home a un equivalent EN en Phase 1
  if (pathname === "/ai" || pathname === "/ai/") return "/en/ai";
  if (pathname.startsWith("/ai/")) {
    // Equivalent EN potentiel (Phase C) ; sinon la home EN reste un fallback sur.
    return `/en${pathname}`;
  }
  return "/en/ai";
}
