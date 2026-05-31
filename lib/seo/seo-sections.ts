/**
 * Generateur de sections SEO programmatiques pour les pages listing
 * /[metier]/[location] (cat × ville et cat × dept).
 *
 * VOCABULAIRE ADAPTÉ AU VERTICAL :
 *   - btp        → "artisan", "travaux", "dépannage", "chantier", "RGE"
 *   - domicile   → "professionnel", "prestations", "intervention", "à domicile"
 *   - personne   → "intervenant", "accompagnement", "service", "pédagogie"
 *
 * Eviter le vocabulaire BTP sur les services a domicile et l'aide a la
 * personne (ex. "artisan ménage" ou "dépannage soutien scolaire" sonne
 * grotesque). Le helper s'adapte automatiquement selon
 * categories.vertical.
 *
 * Stats par dept hardcodees depuis data.gouv.fr (INSEE 2026) pour
 * injecter de la data unique par page et eviter le duplicate content.
 */

import type {
  Category,
  CityWithDepartment,
  Department,
} from "@/lib/types/database";
import { SOURCED_PRICES } from "@/lib/data/sourced-prices";

export type Vertical = "btp" | "domicile" | "personne";

// ============================================================================
// Stats INSEE par dept Nouvelle-Aquitaine (source : data.gouv.fr)
// ============================================================================
type DeptStats = {
  pop_k: number;
  logements_k: number;
  ancien_pct: number;
  res_principales_pct: number;
};

const DEPT_STATS: Record<string, DeptStats> = {
  "16": { pop_k: 347, logements_k: 198, ancien_pct: 49, res_principales_pct: 80 },
  "17": { pop_k: 656, logements_k: 432, ancien_pct: 41, res_principales_pct: 70 },
  "19": { pop_k: 240, logements_k: 159, ancien_pct: 52, res_principales_pct: 71 },
  "23": { pop_k: 117, logements_k: 90, ancien_pct: 56, res_principales_pct: 66 },
  "24": { pop_k: 414, logements_k: 274, ancien_pct: 51, res_principales_pct: 75 },
  "33": { pop_k: 1654, logements_k: 880, ancien_pct: 37, res_principales_pct: 86 },
  "40": { pop_k: 422, logements_k: 270, ancien_pct: 38, res_principales_pct: 79 },
  "47": { pop_k: 333, logements_k: 200, ancien_pct: 51, res_principales_pct: 82 },
  "64": { pop_k: 689, logements_k: 426, ancien_pct: 42, res_principales_pct: 78 },
  "79": { pop_k: 375, logements_k: 219, ancien_pct: 51, res_principales_pct: 83 },
  "86": { pop_k: 442, logements_k: 256, ancien_pct: 47, res_principales_pct: 84 },
  "87": { pop_k: 373, logements_k: 232, ancien_pct: 50, res_principales_pct: 79 },
};

// ============================================================================
// Helpers grammaire
// ============================================================================

function articleDef(categoryName: string): "le" | "la" {
  const fem = new Set([
    "livraison de courses",
    "garde d'enfants",
    "garde animaux",
    "aide aux seniors",
    "aide administrative",
    "vidéosurveillance",
  ]);
  return fem.has(categoryName.toLowerCase().trim()) ? "la" : "le";
}

function pluralizeLower(name: string): string {
  const lower = name.toLowerCase().trim();
  const parts = lower.split(/\s+/);
  parts[0] = /[sx]$/.test(parts[0]) ? parts[0] : parts[0] + "s";
  return parts.join(" ");
}

// ============================================================================
// Listes de prestations par catégorie (adaptées au métier réel)
// ============================================================================
const WORKS_BY_CATEGORY: Record<string, string[]> = {
  // BTP
  plombier: [
    "réparation de fuite d'eau",
    "débouchage de canalisation",
    "installation de chauffe-eau",
    "remplacement de robinetterie",
    "pose de WC et lavabos",
    "rénovation de salle de bain",
    "dépannage urgent 24h/24",
    "détection de fuite cachée",
  ],
  electricien: [
    "mise aux normes NF C 15-100",
    "rénovation complète de l'installation",
    "pose de prises et interrupteurs",
    "installation de tableau électrique",
    "dépannage urgent (coupure, court-circuit)",
    "pose de domotique",
    "diagnostic électrique avant vente",
    "raccordement d'appareils ménagers",
  ],
  macon: [
    "construction de murs porteurs",
    "ouverture dans un mur porteur",
    "création de terrasse",
    "extension de maison",
    "ravalement de façade",
    "pose de béton désactivé",
    "rejointoiement",
    "rénovation de murs en pierre",
  ],
  peintre: [
    "peinture intérieure (murs, plafonds)",
    "peinture extérieure et ravalement",
    "pose de papier peint",
    "préparation et enduit",
    "peinture de boiseries",
    "lasure et vernis",
    "peinture spéciale anti-humidité",
    "rénovation de façade",
  ],
  carreleur: [
    "pose de carrelage au sol",
    "faïence murale (cuisine, salle de bain)",
    "carrelage extérieur (terrasse)",
    "pose grand format",
    "joints et reprise de joints",
    "pose de pierre naturelle",
    "rénovation de salle de bain",
    "création de douche à l'italienne",
  ],
  menuisier: [
    "pose de fenêtres et portes",
    "création d'escalier sur mesure",
    "pose de parquet",
    "agencement (placard, dressing)",
    "création de meubles sur mesure",
    "pose de portail",
    "rénovation de portes anciennes",
    "fabrication de mobilier",
  ],
  couvreur: [
    "réfection complète de toiture",
    "réparation de tuiles cassées",
    "pose de gouttières",
    "isolation des combles",
    "nettoyage et démoussage de toiture",
    "pose de Velux",
    "intervention sur cheminée",
    "diagnostic et expertise toiture",
  ],
  chauffagiste: [
    "installation de chaudière (gaz, fioul, biomasse)",
    "remplacement de chauffe-eau",
    "entretien annuel obligatoire",
    "installation de pompe à chaleur",
    "pose de radiateurs",
    "désembouage du circuit chauffage",
    "diagnostic des fuites de gaz",
    "raccordement au gaz de ville",
  ],
  // Domicile
  jardinage: [
    "tonte de pelouse régulière",
    "taille de haies et arbustes",
    "élagage d'arbres",
    "désherbage",
    "création de massifs",
    "entretien complet du jardin",
    "pose de gazon en rouleau",
    "ramassage de feuilles",
  ],
  menage: [
    "ménage régulier hebdomadaire ou mensuel",
    "nettoyage de printemps approfondi",
    "ménage après travaux",
    "lavage de vitres",
    "entretien de bureaux et locaux",
    "ménage avant état des lieux",
    "repassage à domicile",
    "nettoyage en profondeur",
  ],
  // Personne
  "soutien-scolaire": [
    "aide aux devoirs en primaire et collège",
    "cours particuliers en maths, français, langues",
    "préparation au brevet et baccalauréat",
    "méthodologie et organisation du travail",
    "remise à niveau pendant les vacances",
    "accompagnement personnalisé sur la durée",
    "préparation aux concours et examens",
    "soutien pour enfants à besoins spécifiques",
  ],
  "garde-enfants": [
    "garde régulière à domicile",
    "sortie d'école et accompagnement scolaire",
    "garde de nuit et week-end",
    "babysitting ponctuel ou en soirée",
    "garde partagée entre familles",
    "préparation des repas adaptés",
    "activités d'éveil et bricolage",
    "accompagnement aux activités extra-scolaires",
  ],
  "aide-seniors": [
    "aide à la toilette et à l'habillage",
    "préparation et aide à la prise des repas",
    "courses, démarches administratives",
    "accompagnement aux rendez-vous médicaux",
    "présence et conversation",
    "stimulation cognitive et activités",
    "aide à la mobilité dans le logement",
    "aide ménagère légère",
  ],
};

function getWorksList(categorySlug: string): string[] {
  return (
    WORKS_BY_CATEGORY[categorySlug] ?? [
      "intervention à domicile",
      "diagnostic et devis gratuit",
      "intervention rapide et soignée",
      "travail garanti",
    ]
  );
}

// ============================================================================
// Plages de prix par catégorie
// ============================================================================
const PRICE_RANGES: Record<string, { label: string; range: string }[]> = {
  plombier: [
    { label: "Intervention de dépannage simple", range: "80 € à 150 € hors pièces" },
    { label: "Recherche de fuite non destructive", range: "200 € à 600 €" },
    { label: "Remplacement de chauffe-eau électrique", range: "600 € à 1 500 € pose comprise" },
    { label: "Rénovation complète de salle de bain", range: "4 000 € à 15 000 €" },
    { label: "Débouchage de canalisation", range: "80 € à 300 €" },
  ],
  electricien: [
    { label: "Diagnostic et dépannage simple", range: "80 € à 200 €" },
    { label: "Remplacement d'un disjoncteur", range: "100 € à 250 €" },
    { label: "Pose de prise (par unité)", range: "60 € à 120 €" },
    { label: "Mise aux normes NF C 15-100 (100 m²)", range: "5 000 € à 12 000 €" },
    { label: "Tableau électrique complet", range: "1 500 € à 3 000 €" },
  ],
  macon: [
    { label: "Terrasse béton (par m²)", range: "60 € à 150 €" },
    { label: "Ouverture mur porteur", range: "1 500 € à 5 000 €" },
    { label: "Ravalement de façade (par m²)", range: "30 € à 90 €" },
    { label: "Extension maison (par m²)", range: "1 500 € à 3 000 €" },
    { label: "Pose de parpaings (par m²)", range: "50 € à 100 €" },
  ],
  peintre: [
    { label: "Peinture mur (par m²)", range: "20 € à 40 €" },
    { label: "Peinture plafond (par m²)", range: "25 € à 50 €" },
    { label: "Pièce complète (10-15 m²)", range: "400 € à 900 €" },
    { label: "Ravalement façade (par m²)", range: "30 € à 80 €" },
    { label: "Pose papier peint (par m²)", range: "20 € à 40 €" },
  ],
  carreleur: [
    { label: "Pose de carrelage au sol (par m²)", range: "30 € à 80 €" },
    { label: "Faïence murale (par m²)", range: "40 € à 90 €" },
    { label: "Carrelage grand format (par m²)", range: "60 € à 120 €" },
    { label: "Douche à l'italienne complète", range: "1 500 € à 4 000 €" },
    { label: "Carrelage extérieur (par m²)", range: "40 € à 100 €" },
  ],
  menuisier: [
    { label: "Pose de fenêtre (par fenêtre)", range: "150 € à 400 € pose seule" },
    { label: "Escalier sur mesure", range: "2 000 € à 8 000 €" },
    { label: "Pose de parquet (par m²)", range: "30 € à 80 € pose seule" },
    { label: "Placard sur mesure", range: "800 € à 3 000 €" },
    { label: "Porte intérieure pose comprise", range: "300 € à 800 €" },
  ],
  couvreur: [
    { label: "Réfection complète de toiture (par m²)", range: "100 € à 250 €" },
    { label: "Réparation de tuiles", range: "150 € à 600 €" },
    { label: "Pose de gouttières (par mètre linéaire)", range: "30 € à 60 €" },
    { label: "Pose de Velux", range: "800 € à 2 500 €" },
    { label: "Démoussage de toiture (par m²)", range: "8 € à 15 €" },
  ],
  chauffagiste: [
    { label: "Entretien annuel de chaudière", range: "100 € à 200 €" },
    { label: "Installation de chaudière gaz", range: "3 000 € à 7 000 €" },
    { label: "Pompe à chaleur air/eau", range: "8 000 € à 16 000 €" },
    { label: "Remplacement de chauffe-eau", range: "600 € à 2 500 €" },
    { label: "Désembouage du circuit", range: "400 € à 800 €" },
  ],
  // Domicile
  jardinage: [
    { label: "Tonte de pelouse (par heure)", range: "25 € à 50 €" },
    { label: "Taille de haie (par mètre linéaire)", range: "5 € à 15 €" },
    { label: "Élagage d'arbre", range: "100 € à 500 € selon hauteur" },
    { label: "Entretien régulier (forfait mensuel)", range: "80 € à 300 €" },
    { label: "Création de massif", range: "200 € à 800 €" },
  ],
  menage: [
    { label: "Ménage régulier à domicile (par heure)", range: "18 € à 28 € (CESU + crédit d'impôt 50%)" },
    { label: "Nettoyage complet de printemps", range: "200 € à 500 €" },
    { label: "Ménage après travaux", range: "300 € à 1 200 €" },
    { label: "Lavage de vitres (par m²)", range: "5 € à 15 €" },
    { label: "Repassage à domicile (par heure)", range: "18 € à 25 €" },
  ],
  // Personne
  "soutien-scolaire": [
    { label: "Cours particulier primaire (par heure)", range: "18 € à 30 € (CESU + crédit d'impôt 50%)" },
    { label: "Cours particulier collège (par heure)", range: "20 € à 35 €" },
    { label: "Cours particulier lycée (par heure)", range: "25 € à 45 €" },
    { label: "Préparation au brevet ou baccalauréat", range: "30 € à 50 € de l'heure" },
    { label: "Stage intensif vacances (semaine)", range: "200 € à 600 €" },
  ],
  "garde-enfants": [
    { label: "Garde à domicile (par heure)", range: "12 € à 18 € (CESU + crédit d'impôt 50%)" },
    { label: "Sortie d'école + goûter (par jour)", range: "30 € à 60 €" },
    { label: "Babysitting soirée", range: "10 € à 15 € de l'heure" },
    { label: "Garde partagée (par famille)", range: "8 € à 12 € de l'heure" },
    { label: "Garde de nuit ou week-end", range: "majoration +30% à +50%" },
  ],
  "aide-seniors": [
    { label: "Aide à domicile (par heure)", range: "18 € à 28 € (CESU + crédit d'impôt 50%)" },
    { label: "Aide à la toilette", range: "20 € à 30 € de l'heure" },
    { label: "Accompagnement RDV médical", range: "25 € à 40 € de la course" },
    { label: "Garde de jour ponctuelle", range: "15 € à 22 € de l'heure" },
    { label: "Forfait mensuel régulier", range: "à partir de 400 €/mois selon besoins" },
  ],
};

function getPriceRanges(
  categorySlug: string
): { label: string; range: string }[] {
  // Prix sourcés via Perplexity en priorité (chiffres web réels + cités) ;
  // fallback sur les fourchettes hardcodées si la catégorie n'a pas été sourcée.
  const sourced = SOURCED_PRICES[categorySlug];
  if (sourced && sourced.ranges.length > 0) return sourced.ranges;
  return (
    PRICE_RANGES[categorySlug] ?? [
      { label: "Prestation simple", range: "à partir de 80 €" },
      { label: "Prestation standard", range: "150 € à 400 €" },
      { label: "Prestation complète", range: "à partir de 500 €" },
    ]
  );
}

// ============================================================================
// Vocabulaire par vertical
// ============================================================================
type VerticalTerms = {
  /** "artisan" / "professionnel à domicile" / "intervenant" */
  pro: string;
  /** "artisans" / "professionnels" / "intervenants" */
  proPlural: string;
  /** "professionnel" mot generique pour H1 et titres */
  proFormal: string;
  /** Section 2 H2 template */
  h2_works: (cat: string, loc: string, prep: string) => string;
  /** Section 2 intro */
  intro_works: (catPlural: string, loc: string, prep: string) => string;
  /** Section 5 (depannage / autre) — null si pas pertinent */
  section_urgence: ((cat: string, loc: string, prep: string) => {
    h2: string;
    paragraphs: string[];
  }) | null;
  /** Phrase "demander 3 devis en 30 secondes" adaptée */
  cta_phrase: string;
  /** Phrase pour la "garantie/assurance" — varie selon vertical */
  garantie_phrase: (cat: string) => string;
  /** Adjectif qualifiant la profession (pour FAQ) */
  qualif: string;
};

const VERTICAL_TERMS: Record<Vertical, VerticalTerms> = {
  btp: {
    pro: "artisan",
    proPlural: "artisans",
    proFormal: "professionnel",
    h2_works: (cat, loc, prep) => `Travaux réalisés par un artisan ${cat} ${prep} ${loc}`,
    intro_works: (catPlural, loc, prep) =>
      `Les ${catPlural} ${prep} ${loc} interviennent sur une gamme large de prestations, du dépannage urgent aux chantiers de rénovation complète. Voici les types de travaux les plus fréquemment demandés sur la zone :`,
    section_urgence: (cat, loc, prep) => ({
      h2: `Dépannage ${cat} ${prep} ${loc} : intervention en urgence`,
      paragraphs: [
        `Certains ${cat}s ${prep} ${loc} proposent un service d'astreinte 24h/24 et 7j/7 pour les urgences (fuite active, panne complète, dégât des eaux, sinistre). Comptez une majoration de 30% à 100% par rapport aux tarifs en journée pour les interventions soir/week-end.`,
        `Sur Workwave, vous pouvez déposer une demande "urgente" et recevoir des contacts dans l'heure, ou contacter directement les pros qui affichent leur disponibilité en astreinte sur leur fiche.`,
      ],
    }),
    cta_phrase: "comparer 3 devis gratuits en 30 secondes",
    garantie_phrase: () =>
      "C'est aussi l'assurance d'un devis détaillé, d'une responsabilité civile professionnelle et — pour les travaux concernés — d'une garantie décennale.",
    qualif: "qualifié",
  },
  domicile: {
    pro: "professionnel à domicile",
    proPlural: "professionnels à domicile",
    proFormal: "professionnel",
    h2_works: (cat, loc, prep) => `Prestations de ${cat} ${prep} ${loc}`,
    intro_works: (catPlural, loc, prep) =>
      `Les ${catPlural} ${prep} ${loc} proposent une gamme variée de prestations à domicile, ponctuelles ou récurrentes. Voici les prestations les plus fréquemment demandées sur la zone :`,
    section_urgence: (cat, loc, prep) => ({
      h2: `Modalités d'intervention d'un ${cat} ${prep} ${loc}`,
      paragraphs: [
        `Vous pouvez choisir une intervention ponctuelle (nettoyage de printemps, ménage avant état des lieux) ou récurrente (passage hebdomadaire, mensuel). La majorité des professionnels ${prep} ${loc} proposent les deux formules avec adaptation du tarif au volume horaire.`,
        `Les paiements en CESU (Chèque Emploi Service Universel) ouvrent droit à un crédit d'impôt de 50% sur les sommes versées, dans la limite des plafonds en vigueur. Pensez à demander si le pro accepte ce mode de paiement.`,
      ],
    }),
    cta_phrase: "recevoir 3 propositions gratuites en 30 secondes",
    garantie_phrase: () =>
      "C'est aussi la garantie d'un professionnel déclaré (paiement CESU possible, crédit d'impôt 50%) plutôt que du travail au noir.",
    qualif: "fiable",
  },
  personne: {
    pro: "intervenant",
    proPlural: "intervenants",
    proFormal: "intervenant",
    h2_works: (cat, loc, prep) => `Accompagnement ${cat} ${prep} ${loc}`,
    intro_works: (catPlural, loc, prep) =>
      `Les ${catPlural} ${prep} ${loc} accompagnent les familles et les particuliers sur une grande variété de besoins, ponctuels ou réguliers. Voici les principales formes d'accompagnement proposées :`,
    section_urgence: null, // pas de "depannage" sur l'aide a la personne
    cta_phrase: "être mis en relation avec 3 intervenants qualifiés en 30 secondes",
    garantie_phrase: () =>
      "C'est aussi la garantie d'un intervenant déclaré (paiement CESU possible, crédit d'impôt 50%) qualifié pour ce type d'accompagnement.",
    qualif: "qualifié",
  },
};

// ============================================================================
// Types exportés
// ============================================================================

export type SeoSection = {
  h2: string;
  paragraphs: string[];
  bullets?: string[];
  table?: Array<{ label: string; value: string }>;
  source?: { cite: string; url?: string };
};

export type SeoFaqItem = {
  question: string;
  answer: string;
};

export type SeoContentBundle = {
  sections: SeoSection[];
  faqs: SeoFaqItem[];
};

export type SeoContext = {
  category: Pick<Category, "slug" | "name" | "vertical">;
  city: CityWithDepartment | null;
  department: Department;
  prosCount: number;
};

// ============================================================================
// Generation principale
// ============================================================================

export function generateSeoContent(ctx: SeoContext): SeoContentBundle {
  const cat = ctx.category;
  const vertical = (cat.vertical ?? "btp") as Vertical;
  const v = VERTICAL_TERMS[vertical];

  const catLower = cat.name.toLowerCase();
  const catPlural = pluralizeLower(cat.name);
  const art = articleDef(cat.name);
  const artInst = art === "le" ? "un" : "une";
  const locationName = ctx.city ? ctx.city.name : ctx.department.name;
  const preposition = ctx.city ? "à" : "en";
  const deptCode = ctx.department.code;
  const stats = DEPT_STATS[deptCode] ?? {
    pop_k: 100,
    logements_k: 60,
    ancien_pct: 45,
    res_principales_pct: 80,
  };
  const works = getWorksList(cat.slug);
  const prices = getPriceRanges(cat.slug);

  // Contexte local injecte (data unique par dept = pas de duplicate content)
  const localContext = ctx.city
    ? vertical === "personne"
      ? `${ctx.city.name} fait partie de la ${ctx.department.name} (population du département : environ ${stats.pop_k} 000 habitants).`
      : `${ctx.city.name} fait partie de la ${ctx.department.name} (${stats.pop_k} 000 habitants, ${stats.logements_k} 000 logements${vertical === "btp" ? ` dont ${stats.ancien_pct}% construits avant 1975` : ""}).`
    : vertical === "personne"
      ? `La ${ctx.department.name} compte environ ${stats.pop_k} 000 habitants.`
      : `La ${ctx.department.name} compte environ ${stats.pop_k} 000 habitants et ${stats.logements_k} 000 logements${vertical === "btp" ? `, dont ${stats.ancien_pct}% construits avant 1975` : ""}.`;

  // ─── Section 1 : Pourquoi
  const pourquoi: SeoSection = {
    h2: `Pourquoi faire appel à ${artInst} ${catLower} ${preposition} ${locationName} ?`,
    paragraphs: [
      vertical === "btp"
        ? `Faire appel à ${artInst} ${catLower} professionnel ${preposition} ${locationName} vous garantit un travail conforme aux normes en vigueur, réalisé par un ${v.pro} ${v.qualif} disposant des assurances obligatoires. ${v.garantie_phrase(catLower)}`
        : vertical === "domicile"
          ? `Faire appel à ${artInst} ${catLower} ${preposition} ${locationName} vous fait gagner du temps avec un ${v.pro} ${v.qualif}, formé à ses prestations et accountable. ${v.garantie_phrase(catLower)}`
          : `Faire appel à ${artInst} ${catLower} ${preposition} ${locationName} vous garantit un ${v.pro} ${v.qualif}, attentif et déclaré, capable d'instaurer une relation de confiance avec votre famille. ${v.garantie_phrase(catLower)}`,
      `${localContext} Cette zone génère une demande régulière en ${catPlural}, et Workwave référence ${ctx.prosCount} ${v.proPlural} actifs sur le secteur.`,
      `Vous pouvez comparer leurs profils, leurs spécialités et — quand l'information est publique — leurs avis vérifiés, avant de prendre contact ou de demander plusieurs propositions.`,
    ],
  };

  // ─── Section 2 : Prestations / Travaux / Accompagnement
  const travaux: SeoSection = {
    h2: v.h2_works(catLower, locationName, preposition),
    paragraphs: [v.intro_works(catPlural, locationName, preposition)],
    bullets: works,
  };

  // ─── Section 3 : Comment choisir
  const choisirBullets =
    vertical === "btp"
      ? [
          "Vérifiez le numéro SIRET et l'ancienneté de l'entreprise (un artisan installé depuis 5 ans ou plus a fait ses preuves).",
          "Demandez l'attestation d'assurance décennale et de responsabilité civile professionnelle, valides à la date du chantier.",
          "Consultez les avis clients sur plusieurs sources (Workwave, Google Maps, bouche-à-oreille local).",
          "Privilégiez les artisans certifiés RGE pour les travaux d'amélioration énergétique (éligibilité à MaPrimeRénov').",
          "Comparez au moins 3 devis détaillés et écrits avant de signer.",
          "Méfiez-vous des prix anormalement bas (signe de travail au noir ou de matériel bas de gamme).",
        ]
      : vertical === "domicile"
        ? [
            "Vérifiez le statut du professionnel (auto-entrepreneur, association, entreprise de services à la personne agréée).",
            "Privilégiez les professionnels acceptant le CESU pour bénéficier du crédit d'impôt 50%.",
            "Consultez les avis clients et demandez des références à des particuliers déjà accompagnés.",
            "Définissez clairement le périmètre de la prestation (durée, tâches, fréquence) avant de commencer.",
            "Comparez plusieurs propositions sur la base du tarif horaire ET du planning de disponibilités.",
            "Méfiez-vous des prix anormalement bas (souvent signe de travail au noir sans assurance).",
          ]
        : [
            "Vérifiez la qualification et l'expérience de l'intervenant pour le type d'accompagnement souhaité.",
            "Privilégiez les intervenants déclarés pour bénéficier du crédit d'impôt 50% via CESU.",
            "Demandez à rencontrer la personne avant de débuter (essentiel pour la confiance avec la famille).",
            "Précisez vos attentes : fréquence, horaires, lieu, exigences spécifiques (allergies, méthodes…).",
            "Consultez les avis d'autres familles déjà accompagnées par cette personne.",
            "Privilégiez la continuité (même intervenant sur la durée) plutôt que le rotatif quand c'est possible.",
          ];

  const choisir: SeoSection = {
    h2: `Comment choisir le bon ${catLower} ${preposition} ${locationName} ?`,
    paragraphs: [
      `Plusieurs critères vous aident à identifier ${artInst} ${catLower} ${v.qualif} et de confiance ${preposition} ${locationName} :`,
      `Sur Workwave, chaque fiche affiche le numéro SIRET vérifié, l'ancienneté Sirene, les certifications déclarées et les avis vérifiés des particuliers passés par la plateforme — autant d'éléments à comparer avant de contacter.`,
    ],
    bullets: choisirBullets,
  };

  // ─── Section 4 : Prix
  const sourcedPrice = SOURCED_PRICES[cat.slug];
  const prix: SeoSection = {
    h2: `Tarifs d'un ${catLower} ${preposition} ${locationName}`,
    paragraphs: [
      sourcedPrice
        ? `Voici les fourchettes de prix indicatives pour un ${catLower}, consolidées d'après des sources web récentes (${sourcedPrice.retrievedAt}) :`
        : `Les tarifs ${preposition} ${locationName} se situent dans les fourchettes nationales standard pour la profession. Voici les ordres de prix indicatifs (hors devis personnalisé) :`,
    ],
    table: prices.map((p) => ({ label: p.label, value: p.range })),
    source: sourcedPrice?.sources?.[0]
      ? { cite: `Sources web · ${sourcedPrice.retrievedAt}`, url: sourcedPrice.sources[0] }
      : undefined,
  };
  prix.paragraphs.push(
    vertical === "btp"
      ? `Ces prix sont des indications : ils varient selon l'accessibilité du chantier, la complexité technique, le type de matériel choisi et les majorations soir/week-end. Demandez systématiquement un devis détaillé et gratuit avant tout engagement. Sur Workwave, vous pouvez ${v.cta_phrase}.`
      : `Ces tarifs sont indicatifs et varient selon le volume horaire, la fréquence et les contraintes spécifiques de votre situation. Le paiement en CESU permet un crédit d'impôt de 50% (dans les plafonds en vigueur). Sur Workwave, vous pouvez ${v.cta_phrase}.`
  );

  // ─── Section 5 : Urgence / Modalités (conditionnel selon vertical)
  let urgenceSection: SeoSection | null = null;
  if (v.section_urgence) {
    const urgence = v.section_urgence(catLower, locationName, preposition);
    urgenceSection = {
      h2: urgence.h2,
      paragraphs: urgence.paragraphs,
    };
  }

  // ─── Section finale : Workwave a Y
  const workwave: SeoSection = {
    h2: `Trouver ${artInst} ${catLower} ${preposition} ${locationName} avec Workwave`,
    paragraphs: [
      `Workwave est un annuaire gratuit pour les particuliers, sans création de compte. Nous référençons ${ctx.prosCount} ${v.proPlural} ${preposition} ${locationName}, avec leurs coordonnées vérifiées (SIRET Sirene${vertical === "btp" ? ", certifications RGE croisées avec l'ADEME" : ""}, avis clients post-prestation).`,
      `Vous pouvez soit contacter directement le ${v.proFormal} de votre choix, soit déposer votre besoin en 30 secondes pour ${v.cta_phrase}. Service 100% gratuit pour les particuliers, sans intermédiaire commercial.`,
    ],
  };

  const sections: SeoSection[] = [pourquoi, travaux, choisir, prix];
  if (urgenceSection) sections.push(urgenceSection);
  sections.push(workwave);

  // ─── FAQ adaptée au vertical
  const faqs: SeoFaqItem[] = [
    {
      question: `Combien coûte ${artInst} ${catLower} ${preposition} ${locationName} ?`,
      answer: `Les tarifs varient selon le type de prestation. Pour ${artInst} ${catLower} ${preposition} ${locationName}, comptez ${prices[0]?.range ?? "à partir de 80 €"} pour ${prices[0]?.label.toLowerCase() ?? "une prestation simple"}. Demandez un devis ou une proposition détaillée et gratuite pour avoir une estimation précise adaptée à votre situation.`,
    },
    {
      question: `Comment trouver ${artInst} ${catLower} de confiance ${preposition} ${locationName} ?`,
      answer:
        vertical === "btp"
          ? `Vérifiez le numéro SIRET, l'ancienneté de l'entreprise, les certifications (RGE, Qualibat, décennale) et les avis clients. Sur Workwave, ces informations sont vérifiées et visibles directement sur chaque fiche pro. Comparez au moins 3 devis avant de choisir.`
          : vertical === "domicile"
            ? `Vérifiez que le professionnel est déclaré (accepte le CESU = crédit d'impôt 50%), consultez ses avis clients et précisez clairement vos attentes avant de commencer. Sur Workwave, comparez plusieurs propositions sur tarif horaire + disponibilités.`
            : `Privilégiez les intervenants déclarés (CESU = crédit d'impôt 50%), expérimentés sur le type d'accompagnement souhaité, et qui acceptent un premier rendez-vous de rencontre. Sur Workwave, vous pouvez consulter leurs profils, leurs spécialités et les avis d'autres familles.`,
    },
    vertical === "btp"
      ? {
          question: `Un ${catLower} peut-il intervenir en urgence ${preposition} ${locationName} ?`,
          answer: `Oui, plusieurs ${catPlural} ${preposition} ${locationName} proposent un service d'astreinte 24h/24 pour les urgences. Comptez une majoration de 30% à 100% sur le tarif standard. Sur Workwave, déposez une demande urgente pour être recontacté dans l'heure.`,
        }
      : {
          question:
            vertical === "domicile"
              ? `Le paiement en CESU est-il possible ${preposition} ${locationName} ?`
              : `Comment fonctionne le crédit d'impôt sur les services d'aide à la personne ?`,
          answer:
            vertical === "domicile"
              ? `Oui, la majorité des ${catPlural} ${preposition} ${locationName} acceptent le paiement en CESU (Chèque Emploi Service Universel). Cela ouvre droit à un crédit d'impôt de 50% sur les sommes versées, dans la limite des plafonds fiscaux en vigueur. Demandez systématiquement avant de commencer.`
              : `Les services d'aide à la personne déclarés (CESU, entreprise agréée, association) ouvrent droit à un crédit d'impôt de 50% sur les sommes versées, dans la limite des plafonds en vigueur. Ce crédit est applicable que vous soyez imposable ou non. Vérifiez auprès de l'intervenant qu'il vous délivre les attestations fiscales.`,
        },
    {
      question: `Les devis (ou propositions) sont-ils gratuits ${preposition} ${locationName} ?`,
      answer:
        vertical === "btp"
          ? `La grande majorité des artisans proposent un devis gratuit et sans engagement (obligation légale au-delà de 1 500 € TTC). Si un professionnel facture le devis, demandez-vous pourquoi. Sur Workwave, tous les devis sont 100% gratuits.`
          : `Oui, la plupart des ${catPlural} ${preposition} ${locationName} proposent un premier échange et une estimation gratuite, sans engagement. Sur Workwave, le service est 100% gratuit pour les particuliers — sans inscription, sans frais cachés.`,
    },
    {
      question: `Combien de ${catPlural} sont référencés ${preposition} ${locationName} sur Workwave ?`,
      answer: `Workwave référence ${ctx.prosCount} ${catPlural} ${preposition} ${locationName} avec leurs coordonnées vérifiées${vertical === "btp" ? " (SIRET Sirene + certifications RGE/ADEME quand disponibles)" : ""}. Vous pouvez comparer leurs profils, voir les avis clients et ${v.cta_phrase}.`,
    },
    {
      question:
        vertical === "btp"
          ? `Quels travaux réalise ${artInst} ${catLower} ${preposition} ${locationName} ?`
          : vertical === "domicile"
            ? `Quelles prestations propose ${artInst} ${catLower} ${preposition} ${locationName} ?`
            : `Quels types d'accompagnement propose ${artInst} ${catLower} ${preposition} ${locationName} ?`,
      answer: `Les ${catPlural} ${preposition} ${locationName} interviennent sur : ${works.slice(0, 4).join(", ")}, et bien d'autres. Précisez votre besoin pour être mis en relation avec les ${v.proPlural} les plus adaptés.`,
    },
  ];

  return { sections, faqs };
}

/**
 * Calcule un AggregateRating global pour la page (moyenne ponderee
 * Workwave + Google sur les pros affiches).
 */
export function computePageAggregateRating(
  pros: Array<{
    google_rating?: number | null;
    google_reviews_count?: number | null;
    workwave_reviews_avg?: number | null;
    workwave_reviews_count?: number;
  }>
): { ratingValue: number; reviewCount: number } | null {
  let totalCount = 0;
  let weightedSum = 0;
  for (const p of pros) {
    const gr = p.google_rating ?? 0;
    const gc = p.google_reviews_count ?? 0;
    const wr = p.workwave_reviews_avg ?? 0;
    const wc = p.workwave_reviews_count ?? 0;
    if (gc > 0) {
      weightedSum += gr * gc;
      totalCount += gc;
    }
    if (wc > 0) {
      weightedSum += wr * wc;
      totalCount += wc;
    }
  }
  if (totalCount === 0) return null;
  return {
    ratingValue: Math.round((weightedSum / totalCount) * 10) / 10,
    reviewCount: totalCount,
  };
}
