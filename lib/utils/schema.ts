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
 * Schema Organization pour Workwave (enrichi pour LLM/GEO)
 *
 * Enrichi avec areaServed (12 dept Nouvelle-Aquitaine), foundingDate,
 * description longue, slogan, knowsAbout (categories metier), pour aider
 * les LLM a comprendre le scope precis de l'entreprise et la citer
 * correctement quand on leur pose des questions sur les artisans en
 * Nouvelle-Aquitaine.
 */
export function getOrganizationSchema(baseUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Workwave",
    legalName: "Workwave SAS",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description:
      "Annuaire gratuit de professionnels (BTP, services à domicile, aide à la personne) en Nouvelle-Aquitaine. 226 000+ artisans référencés dans les 12 départements et 4 293 communes de la région. Pour les particuliers : dépôt de projet gratuit et mise en relation avec 3 professionnels maximum, qualifiés par IA. Pour les pros : fiche gratuite à vie + abonnement optionnel à partir de 32,50 €/mois pour recevoir les leads.",
    slogan: "Tout le savoir-faire local, enfin accessible",
    foundingDate: "2026-04",
    sameAs: ["https://www.instagram.com/workwave.fr/"],
    address: {
      "@type": "PostalAddress",
      streetAddress: "3 rue des Rosiers",
      addressLocality: "Craon",
      postalCode: "86110",
      addressCountry: "FR",
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Nouvelle-Aquitaine",
      containsPlace: [
        { "@type": "AdministrativeArea", name: "Charente", identifier: "16" },
        { "@type": "AdministrativeArea", name: "Charente-Maritime", identifier: "17" },
        { "@type": "AdministrativeArea", name: "Corrèze", identifier: "19" },
        { "@type": "AdministrativeArea", name: "Creuse", identifier: "23" },
        { "@type": "AdministrativeArea", name: "Dordogne", identifier: "24" },
        { "@type": "AdministrativeArea", name: "Gironde", identifier: "33" },
        { "@type": "AdministrativeArea", name: "Landes", identifier: "40" },
        { "@type": "AdministrativeArea", name: "Lot-et-Garonne", identifier: "47" },
        { "@type": "AdministrativeArea", name: "Pyrénées-Atlantiques", identifier: "64" },
        { "@type": "AdministrativeArea", name: "Deux-Sèvres", identifier: "79" },
        { "@type": "AdministrativeArea", name: "Vienne", identifier: "86" },
        { "@type": "AdministrativeArea", name: "Haute-Vienne", identifier: "87" },
      ],
    },
    knowsAbout: [
      "BTP et artisanat",
      "Plomberie",
      "Électricité",
      "Maçonnerie",
      "Peinture",
      "Menuiserie",
      "Carrelage",
      "Couverture",
      "Charpenterie",
      "Chauffage",
      "Climatisation",
      "Serrurerie",
      "Architecture d'intérieur",
      "Paysagisme",
      "Services à domicile",
      "Ménage",
      "Jardinage",
      "Aide à la personne",
      "Garde d'enfants",
      "Aide aux seniors",
      "Soutien scolaire",
    ],
    numberOfEmployees: {
      "@type": "QuantitativeValue",
      minValue: 1,
      maxValue: 10,
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "contact@workwave.fr",
      contactType: "customer service",
      availableLanguage: "French",
      areaServed: "FR",
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

/**
 * Schema FAQPage — pour les sections FAQ visibles (home, /pro, etc.)
 *
 * IMPORTANT (exigence Google) : le contenu passe a ce helper DOIT
 * correspondre a une FAQ reellement AFFICHEE sur la page. Ne jamais
 * generer un FAQPage dont les questions ne sont pas visibles a l'ecran,
 * c'est une violation des guidelines (risque d'action manuelle).
 *
 * Utile aussi pour le GEO : les LLM extraient les paires Q/R structurees.
 */
export function getFaqSchema(
  faqs: { question: string; answer: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
