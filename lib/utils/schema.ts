/**
 * Helpers pour generer des schemas JSON-LD (schema.org)
 */

import type { OpeningHours, DaySchedule } from "@/lib/types/database";

const DAYS_MAP: Record<string, string> = {
  lundi: "Monday",
  mardi: "Tuesday",
  mercredi: "Wednesday",
  jeudi: "Thursday",
  vendredi: "Friday",
  samedi: "Saturday",
  dimanche: "Sunday",
};

/**
 * Convertit les horaires Workwave en OpeningHoursSpecification schema.org
 */
export function toOpeningHoursSpecification(
  hours: OpeningHours
): Record<string, unknown>[] {
  const specs: Record<string, unknown>[] = [];
  for (const [key, dayEnglish] of Object.entries(DAYS_MAP)) {
    const day = (hours as Record<string, DaySchedule>)[key];
    if (day?.open && day.from && day.to) {
      specs.push({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: dayEnglish,
        opens: day.from,
        closes: day.to,
      });
    }
  }
  return specs;
}

/**
 * Genere un schema BreadcrumbList
 */
export function toBreadcrumbSchema(
  items: { label: string; href?: string }[],
  baseUrl: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${baseUrl}${item.href}` } : {}),
    })),
  };
}

/**
 * Schema Organization pour Workwave
 */
export function getOrganizationSchema(baseUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Workwave",
    legalName: "Workwave SAS",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [],
    address: {
      "@type": "PostalAddress",
      streetAddress: "3 rue des Rosiers",
      addressLocality: "Craon",
      postalCode: "86110",
      addressCountry: "FR",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "contact@workwave.fr",
      contactType: "customer service",
      availableLanguage: "French",
    },
    taxID: "943055830",
  };
}

/**
 * Schema WebSite avec SearchAction pour la homepage
 */
export function getWebSiteSchema(baseUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Workwave",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/recherche?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
