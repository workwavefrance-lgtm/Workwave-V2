/**
 * Generateur de sections SEO programmatiques pour les pages listing
 * /[metier]/[location] (cat × ville et cat × dept) — style Travaux.com.
 *
 * Strategie : 6 sections H2 par page, avec interpolation
 * {metier} {ville} + data factuelle UNIQUE par dept (logements, pop)
 * pour eviter le duplicate content que Google penalise.
 *
 * Stats par dept hardcodees depuis data.gouv.fr (INSEE 2026) :
 *   - population (millions)
 *   - logements_total (milliers)
 *   - logements_avant_1975_pct (pour justifier le besoin de plombier/elec
 *     dans le logement ancien)
 *   - residences_principales_pct
 *
 * Source : data.gouv.fr dataset "Recensement de la population" + "Logements"
 * + "Populations de reference" (INSEE).
 */

import type { Category, CityWithDepartment, Department } from "@/lib/types/database";

// ============================================================================
// Stats INSEE par departement Nouvelle-Aquitaine
// Source : data.gouv.fr (datasets INSEE 2026), arrondis pour lisibilite
// ============================================================================
type DeptStats = {
  /** Population totale (en milliers) */
  pop_k: number;
  /** Nombre de logements (en milliers) */
  logements_k: number;
  /** % logements construits avant 1975 (lien plomberie/elec ancienne) */
  ancien_pct: number;
  /** % residences principales (vs secondaires/vacants) */
  res_principales_pct: number;
};

const DEPT_STATS: Record<string, DeptStats> = {
  "16": { pop_k: 347, logements_k: 198, ancien_pct: 49, res_principales_pct: 80 }, // Charente
  "17": { pop_k: 656, logements_k: 432, ancien_pct: 41, res_principales_pct: 70 }, // Charente-Maritime
  "19": { pop_k: 240, logements_k: 159, ancien_pct: 52, res_principales_pct: 71 }, // Corrèze
  "23": { pop_k: 117, logements_k: 90, ancien_pct: 56, res_principales_pct: 66 }, // Creuse
  "24": { pop_k: 414, logements_k: 274, ancien_pct: 51, res_principales_pct: 75 }, // Dordogne
  "33": { pop_k: 1654, logements_k: 880, ancien_pct: 37, res_principales_pct: 86 }, // Gironde
  "40": { pop_k: 422, logements_k: 270, ancien_pct: 38, res_principales_pct: 79 }, // Landes
  "47": { pop_k: 333, logements_k: 200, ancien_pct: 51, res_principales_pct: 82 }, // Lot-et-Garonne
  "64": { pop_k: 689, logements_k: 426, ancien_pct: 42, res_principales_pct: 78 }, // Pyrenees-Atlantiques
  "79": { pop_k: 375, logements_k: 219, ancien_pct: 51, res_principales_pct: 83 }, // Deux-Sevres
  "86": { pop_k: 442, logements_k: 256, ancien_pct: 47, res_principales_pct: 84 }, // Vienne
  "87": { pop_k: 373, logements_k: 232, ancien_pct: 50, res_principales_pct: 79 }, // Haute-Vienne
};

// ============================================================================
// Helpers de formulation (variations pour eviter le duplicate content)
// ============================================================================

function articleDef(categoryName: string): "le" | "la" {
  // Articles feminins minoritaires (basé sur category-grammar)
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
// Liste de types de travaux par categorie (pour la section "Travaux realises")
// ============================================================================
const WORKS_BY_CATEGORY: Record<string, string[]> = {
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
    "ménage régulier (hebdomadaire/mensuel)",
    "nettoyage complet de printemps",
    "ménage après travaux",
    "lavage de vitres",
    "entretien de bureaux",
    "ménage avant état des lieux",
    "repassage à domicile",
    "nettoyage en profondeur",
  ],
};

function getWorksList(categorySlug: string): string[] {
  return WORKS_BY_CATEGORY[categorySlug] ?? [
    `prestation standard de ${categorySlug}`,
    "intervention à domicile",
    "diagnostic et devis gratuit",
    "intervention rapide",
    "travail soigné et garanti",
  ];
}

// ============================================================================
// Plages de prix indicatives par categorie (recherches mensuelles tres
// elevees sur "prix [metier] [ville]" → gros volume SEO)
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
    { label: "Mise aux normes NF C 15-100 (maison 100 m²)", range: "5 000 € à 12 000 €" },
    { label: "Tableau électrique complet", range: "1 500 € à 3 000 €" },
  ],
  macon: [
    { label: "Création d'une terrasse béton (par m²)", range: "60 € à 150 €" },
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
    { label: "Création d'un escalier sur mesure", range: "2 000 € à 8 000 €" },
    { label: "Pose de parquet (par m²)", range: "30 € à 80 € pose seule" },
    { label: "Placard sur mesure", range: "800 € à 3 000 €" },
    { label: "Porte intérieure pose comprise", range: "300 € à 800 €" },
  ],
  couvreur: [
    { label: "Réfection complète de toiture (par m²)", range: "100 € à 250 €" },
    { label: "Réparation de tuiles", range: "150 € à 600 € selon l'ampleur" },
    { label: "Pose de gouttières (par mètre linéaire)", range: "30 € à 60 €" },
    { label: "Pose de Velux", range: "800 € à 2 500 €" },
    { label: "Démoussage de toiture", range: "8 € à 15 € par m²" },
  ],
  chauffagiste: [
    { label: "Entretien annuel de chaudière", range: "100 € à 200 €" },
    { label: "Installation de chaudière gaz", range: "3 000 € à 7 000 €" },
    { label: "Installation pompe à chaleur air/eau", range: "8 000 € à 16 000 €" },
    { label: "Remplacement de chauffe-eau", range: "600 € à 2 500 €" },
    { label: "Désembouage du circuit", range: "400 € à 800 €" },
  ],
  jardinage: [
    { label: "Tonte de pelouse (par heure)", range: "25 € à 50 €" },
    { label: "Taille de haie (par mètre linéaire)", range: "5 € à 15 €" },
    { label: "Élagage d'arbre", range: "100 € à 500 € selon hauteur" },
    { label: "Entretien régulier (forfait mensuel)", range: "80 € à 300 €" },
    { label: "Création de massif", range: "200 € à 800 €" },
  ],
  menage: [
    { label: "Ménage régulier (par heure)", range: "18 € à 28 € (CESU)" },
    { label: "Nettoyage complet de printemps", range: "200 € à 500 €" },
    { label: "Ménage après travaux", range: "300 € à 1 200 €" },
    { label: "Lavage de vitres", range: "5 € à 15 € par m²" },
    { label: "Repassage à domicile (par heure)", range: "18 € à 25 €" },
  ],
};

function getPriceRanges(
  categorySlug: string
): { label: string; range: string }[] {
  return (
    PRICE_RANGES[categorySlug] ?? [
      { label: "Prestation simple", range: "à partir de 80 €" },
      { label: "Prestation standard", range: "150 € à 400 €" },
      { label: "Prestation complète", range: "à partir de 500 €" },
    ]
  );
}

// ============================================================================
// Sections SEO generees par page
// ============================================================================

export type SeoSection = {
  /** H2 affiché sur la page */
  h2: string;
  /** Paragraphes (texte brut, pas de HTML) */
  paragraphs: string[];
  /** Liste optionnelle (bullets) */
  bullets?: string[];
  /** Tableau optionnel (pour les prix) */
  table?: Array<{ label: string; value: string }>;
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
  category: Pick<Category, "slug" | "name">;
  /** Ville ou null si on est sur une page departement */
  city: CityWithDepartment | null;
  /** Departement courant (city.department si city, sinon le dept lui-meme) */
  department: Department;
  /** Nombre total de pros sur cette page (pour les phrases dynamiques) */
  prosCount: number;
};

/**
 * Genere les 6 sections H2 + 6 FAQs pour une combinaison (cat, ville/dept).
 * Toutes les phrases sont interpolees avec data unique (population dept,
 * % logements anciens, etc.) pour eviter le duplicate content.
 */
export function generateSeoContent(ctx: SeoContext): SeoContentBundle {
  const cat = ctx.category;
  const catLower = cat.name.toLowerCase();
  const catPlural = pluralizeLower(cat.name);
  const art = articleDef(cat.name);
  const artInst = art === "le" ? "un" : "une"; // "un plombier" / "une garde d'enfants"
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

  // Phrase "data unique" qui change selon la ville/dept
  const localContext = ctx.city
    ? `${ctx.city.name} fait partie de la ${ctx.department.name} (population du département : environ ${stats.pop_k} 000 habitants, ${stats.logements_k} 000 logements dont ${stats.ancien_pct}% construits avant 1975).`
    : `La ${ctx.department.name} compte environ ${stats.pop_k} 000 habitants et ${stats.logements_k} 000 logements, dont ${stats.ancien_pct}% construits avant 1975 — un parc immobilier qui génère des besoins réguliers en maintenance et rénovation.`;

  // ─── Section 1 : Pourquoi faire appel à un X à Y ?
  const pourquoi: SeoSection = {
    h2: `Pourquoi faire appel à ${artInst} ${catLower} ${preposition} ${locationName} ?`,
    paragraphs: [
      `Faire appel à ${artInst} ${catLower} professionnel ${preposition} ${locationName} vous garantit un travail conforme aux normes en vigueur, réalisé par un artisan qualifié disposant des assurances obligatoires (responsabilité civile professionnelle, garantie décennale pour les travaux concernés). C'est aussi l'assurance d'un devis détaillé et d'un recours en cas de litige.`,
      `${localContext} ${stats.ancien_pct >= 45 ? `Cette part importante de logements anciens explique la forte demande en ${catPlural} qualifiés sur la zone.` : `Le parc immobilier de la zone, à la fois récent et ancien, génère une demande variée pour les ${catPlural}.`}`,
      `Workwave référence ${ctx.prosCount} ${catPlural} ${preposition} ${locationName}, dont une partie a déjà été contactée via notre plateforme avec des retours d'avis vérifiés. Vous pouvez comparer leurs profils, voir leurs certifications (RGE, Qualibat, décennale) et demander plusieurs devis en quelques minutes.`,
    ],
  };

  // ─── Section 2 : Travaux réalisés par un X à Y
  const travaux: SeoSection = {
    h2: `Travaux réalisés par ${artInst} artisan ${catLower} ${preposition} ${locationName}`,
    paragraphs: [
      `Les ${catPlural} ${preposition} ${locationName} interviennent sur une gamme large de prestations, du dépannage urgent aux chantiers de rénovation complète. Voici les types de travaux les plus fréquemment demandés sur la zone :`,
    ],
    bullets: works,
  };

  // ─── Section 3 : Comment choisir le bon X à Y ?
  const choisir: SeoSection = {
    h2: `Comment choisir le bon ${catLower} ${preposition} ${locationName} ?`,
    paragraphs: [
      `Plusieurs critères objectifs vous aident à identifier ${artInst} ${catLower} de confiance ${preposition} ${locationName} :`,
    ],
    bullets: [
      "Vérifiez le numéro SIRET et l'ancienneté de l'entreprise (un artisan installé depuis 5 ans ou plus a fait ses preuves).",
      "Demandez l'attestation d'assurance décennale et de responsabilité civile professionnelle, valides à la date du chantier.",
      "Consultez les avis clients sur plusieurs sources (Workwave, Google Maps, bouche-à-oreille local).",
      "Privilégiez les artisans certifiés RGE pour les travaux d'amélioration énergétique (éligibilité aux aides MaPrimeRénov').",
      "Comparez au moins 3 devis détaillés et écrits avant de signer.",
      "Méfiez-vous des prix anormalement bas (signe de travail au noir ou de matériel bas de gamme).",
    ],
    paragraphs2: undefined,
  } as SeoSection;
  choisir.paragraphs.push(
    `Sur Workwave, chaque fiche pro affiche le numéro SIRET vérifié, l'ancienneté Sirene, les certifications déclarées et les avis vérifiés des particuliers passés par la plateforme — autant d'éléments à comparer avant de contacter.`
  );

  // ─── Section 4 : Prix des prestations
  const prix: SeoSection = {
    h2: `Prix des prestations d'un ${catLower} ${preposition} ${locationName}`,
    paragraphs: [
      `Les tarifs ${preposition} ${locationName} se situent dans les fourchettes nationales standard pour la profession. Voici les ordres de prix indicatifs (hors devis personnalisé) :`,
    ],
    table: prices.map((p) => ({ label: p.label, value: p.range })),
  };
  prix.paragraphs.push(
    `Ces prix sont des indications : ils varient selon l'accessibilité du chantier, la complexité technique, le type de matériel choisi et les majorations soir/week-end. Demandez systématiquement un devis détaillé et gratuit avant tout engagement. Workwave permet de recevoir 3 devis sans engagement en 30 secondes.`
  );

  // ─── Section 5 : Dépannage / Intervention urgente
  const depannage: SeoSection = {
    h2: `Dépannage ${catLower} ${preposition} ${locationName} : intervention en urgence`,
    paragraphs: [
      `Certains ${catPlural} ${preposition} ${locationName} proposent un service d'astreinte 24h/24 et 7j/7 pour les urgences (fuite active, panne complète, dégât des eaux, sinistre électrique). Comptez une majoration de 30% à 100% par rapport aux tarifs en journée pour les interventions soir/week-end.`,
      `Sur Workwave, vous pouvez déposer une demande "urgente" et recevoir des contacts dans l'heure, ou contacter directement les pros qui affichent leur disponibilité en astreinte sur leur fiche.`,
    ],
  };

  // ─── Section 6 : Workwave a Y (proposition de valeur locale)
  const workwave: SeoSection = {
    h2: `Trouver ${artInst} ${catLower} ${preposition} ${locationName} avec Workwave`,
    paragraphs: [
      `Workwave est un annuaire gratuit pour les particuliers, sans création de compte. Nous référençons ${ctx.prosCount} ${catPlural} ${preposition} ${locationName}, avec leurs coordonnées vérifiées (SIRET Sirene, certifications RGE croisées avec l'ADEME, avis clients post-prestation).`,
      `Vous pouvez soit contacter directement l'artisan de votre choix, soit déposer votre projet en 30 secondes — votre demande est transmise à 3 artisans qualifiés qui vous recontactent avec un devis. Service 100% gratuit pour les particuliers, sans intermédiaire commercial.`,
    ],
  };

  // ─── FAQ programmatique
  const faqs: SeoFaqItem[] = [
    {
      question: `Combien coûte ${artInst} ${catLower} ${preposition} ${locationName} ?`,
      answer: `Les tarifs varient selon le type de prestation. Pour un ${catLower} ${preposition} ${locationName}, comptez ${prices[0]?.range ?? "à partir de 80 €"} pour ${prices[0]?.label.toLowerCase() ?? "une intervention simple"}. Demandez un devis détaillé et gratuit pour avoir une estimation précise adaptée à votre projet.`,
    },
    {
      question: `Comment trouver ${artInst} ${catLower} de confiance ${preposition} ${locationName} ?`,
      answer: `Vérifiez le numéro SIRET, l'ancienneté de l'entreprise, les certifications (RGE, Qualibat, décennale) et les avis clients. Sur Workwave, ces informations sont vérifiées et visibles directement sur chaque fiche pro. Comparez au moins 3 devis avant de choisir.`,
    },
    {
      question: `Un ${catLower} peut-il intervenir en urgence ${preposition} ${locationName} ?`,
      answer: `Oui, plusieurs ${catPlural} ${preposition} ${locationName} proposent un service d'astreinte 24h/24 pour les urgences. Comptez une majoration de 30% à 100% sur le tarif standard. Sur Workwave, déposez une demande "urgente" pour être recontacté dans l'heure.`,
    },
    {
      question: `Les devis sont-ils gratuits ${preposition} ${locationName} ?`,
      answer: `La grande majorité des artisans proposent un devis gratuit et sans engagement. C'est même une obligation légale au-delà de 1 500 € TTC. Si un professionnel facture le devis, demandez-vous pourquoi. Sur Workwave, tous les devis sont 100% gratuits.`,
    },
    {
      question: `Combien de ${catPlural} sont référencés ${preposition} ${locationName} sur Workwave ?`,
      answer: `Workwave référence ${ctx.prosCount} ${catPlural} ${preposition} ${locationName} avec leurs coordonnées vérifiées (SIRET Sirene + certifications RGE/ADEME quand disponibles). Vous pouvez comparer leurs profils, voir les avis clients et demander 3 devis gratuits en 30 secondes.`,
    },
    {
      question: `Quels travaux réalise ${artInst} ${catLower} ${preposition} ${locationName} ?`,
      answer: `Les ${catPlural} ${preposition} ${locationName} interviennent sur des prestations variées : ${works.slice(0, 4).join(", ")}, et bien d'autres. Précisez votre besoin dans le formulaire de devis pour être mis en relation avec les artisans les plus adaptés.`,
    },
  ];

  return {
    sections: [pourquoi, travaux, choisir, prix, depannage, workwave],
    faqs,
  };
}

/**
 * Calcule un AggregateRating global pour la page (moyenne ponderee
 * Workwave + Google sur les pros affiches). Utilise par le schema
 * Service pour declencher le rich snippet ★ dans la SERP Google.
 *
 * Retourne null si on n'a aucune source d'avis (la grosse majorite
 * des pros aujourd'hui — on n'enverra pas de aggregateRating si on
 * n'a pas la data, evite le warning Search Console).
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
