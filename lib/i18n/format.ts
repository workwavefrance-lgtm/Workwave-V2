/**
 * Formatage monetaire multi-devise pour Workwave AI international.
 *
 * PRINCIPE (cf. plan archi i18n) : la donnee reste en EUR en base (TJM_REFERENCE
 * dans lib/data/tech-tjm-reference.ts est en EUR/jour). On convertit UNIQUEMENT
 * a l'affichage selon la locale / region. Aucune colonne devise a stocker.
 *
 * Les taux ci-dessous sont INDICATIFS et a rafraichir periodiquement. Les pages
 * qui affichent une conversion doivent le mentionner ("approx.", "indicatif").
 * On ne pretend pas a un taux de marche temps reel — c'est un repere de TJM.
 *
 * Derniere MAJ taux : 2026-05 (ordre de grandeur).
 */

import type { Locale } from "./config";

// Taux EUR -> devise. Indicatifs (~mai 2026).
export const FX_FROM_EUR = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.85,
  AED: 3.97, // dirham EAU (peg USD)
  SAR: 4.05, // riyal saoudien (peg USD)
  QAR: 3.93, // riyal qatari (peg USD)
  CHF: 0.96,
} as const;

export type Currency = keyof typeof FX_FROM_EUR;

const LOCALE_INTL: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
};

/**
 * Devise par defaut d'une locale. En l'absence de region precise, l'anglais
 * affiche en USD (devise globale freelance : Upwork, Arc.dev, Stack Overflow).
 */
export function currencyForLocale(locale: Locale): Currency {
  return locale === "en" ? "USD" : "EUR";
}

/** Devise recommandee pour une region (pages pays/ville Phase C). */
export function currencyForRegion(region?: string): Currency | null {
  switch (region) {
    case "AE":
      return "AED";
    case "SA":
      return "SAR";
    case "QA":
      return "QAR";
    case "GB":
      return "GBP";
    case "CH":
      return "CHF";
    case "US":
      return "USD";
    default:
      return null;
  }
}

export function convertFromEur(eur: number, currency: Currency): number {
  return eur * FX_FROM_EUR[currency];
}

/** Arrondi "joli" pour ne pas afficher de fausse precision (430 -> 430, 437 -> 440). */
function roundNice(value: number): number {
  if (value >= 1000) return Math.round(value / 50) * 50;
  return Math.round(value / 10) * 10;
}

export function formatMoney(
  amount: number,
  currency: Currency,
  locale: Locale
): string {
  return new Intl.NumberFormat(LOCALE_INTL[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formate un TJM (EUR/jour en base) dans la devise/locale d'affichage.
 *   formatTjm(450, "en")            -> "$490/day"
 *   formatTjm(450, "en", "AED")     -> "AED 1,800/day"
 *   formatTjm(450, "fr")            -> "450 €/jour"
 */
export function formatTjm(
  eurPerDay: number,
  locale: Locale,
  currency?: Currency
): string {
  const cur = currency ?? currencyForLocale(locale);
  const converted = roundNice(convertFromEur(eurPerDay, cur));
  const money = formatMoney(converted, cur, locale);
  return locale === "en" ? `${money}/day` : `${money}/jour`;
}

/**
 * Formate une fourchette de TJM.
 *   formatTjmRange(450, 600, "en") -> "$490–$650/day"
 */
export function formatTjmRange(
  minEur: number,
  maxEur: number,
  locale: Locale,
  currency?: Currency
): string {
  const cur = currency ?? currencyForLocale(locale);
  const min = roundNice(convertFromEur(minEur, cur));
  const max = roundNice(convertFromEur(maxEur, cur));
  const minStr = formatMoney(min, cur, locale);
  const maxStr = formatMoney(max, cur, locale);
  return locale === "en"
    ? `${minStr}–${maxStr}/day`
    : `${minStr}–${maxStr}/jour`;
}
