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
 * Enrichi avec areaServed (toute la France), foundingDate,
 * description longue, slogan, knowsAbout (categories metier), pour aider
 * les LLM a comprendre le scope precis de l'entreprise et la citer
 * correctement quand on leur pose des questions sur les artisans en France.
 */
export function getOrganizationSchema(baseUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Workwave",
    legalName: "Workwave",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description:
      "Annuaire gratuit de professionnels (BTP, services à domicile, aide à la personne) dans toute la France. 2 400 000+ artisans référencés dans 101 départements et 34 046 communes (métropole et outre-mer). Pour les particuliers : dépôt de projet gratuit et mise en relation avec les professionnels qualifiés de votre zone, qualifiés par IA. Pour les pros : fiche gratuite à vie + paiement à la demande de 9,90 € par lead débloqué, sans abonnement.",
    slogan: "Tout le savoir-faire local, enfin accessible",
    foundingDate: "2025-03-28",
    sameAs: [
      "https://www.instagram.com/workwave.fr/",
      "https://www.wikidata.org/wiki/Q139891069",
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "3 rue des Rosiers",
      addressLocality: "Craon",
      postalCode: "86110",
      addressCountry: "FR",
    },
    areaServed: {
      "@type": "Country",
      name: "France",
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
