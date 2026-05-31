/**
 * Contenu SEO/AEO UNIQUE par fiche pro, 100% factuel (Sirene + prix sourcés),
 * zéro invention. Conçu pour sortir les ~1M fiches du "squelette" et les rendre
 * indexables/uniques SANS dupliquer le contenu des pages listing /[metier]/[ville]
 * (ici on parle de CETTE entreprise : nom, SIRET, ancienneté, ville).
 *
 * Coût : 0 $ (assemblage de données existantes, pas d'appel IA).
 */
import { SOURCED_PRICES } from "@/lib/data/sourced-prices";

type ProForContent = {
  name: string;
  siret?: string | null;
  founded_year?: number | null;
  founding_date?: string | null;
  phone?: string | null;
  category?: { name?: string | null; slug?: string | null } | null;
  city?: { name?: string | null; department?: { name?: string | null } | null } | null;
};

export type ProFaq = { question: string; answer: string };
export type ProContent = { about: string; faqs: ProFaq[]; sourcesNote: string };

function getYear(pro: ProForContent): number | null {
  if (pro.founded_year && pro.founded_year > 1800) return pro.founded_year;
  if (pro.founding_date) {
    const y = new Date(pro.founding_date).getFullYear();
    if (!Number.isNaN(y) && y > 1800) return y;
  }
  return null;
}

export function buildProContent(pro: ProForContent): ProContent | null {
  const name = (pro.name || "").trim();
  const catName = pro.category?.name || null;
  const cityName = pro.city?.name || null;
  // Sans nom + métier + ville, pas de contenu sensé : on s'abstient (pas d'invention).
  if (!name || !catName || !cityName) return null;

  const catLower = catName.toLowerCase();
  const deptName = pro.city?.department?.name || null;
  const year = getYear(pro);
  const anc = year ? new Date().getFullYear() - year : 0;

  // ── « À propos » : prose factuelle, unique par pro (nom/métier/ville/SIRET/année) ──
  const aboutParts: string[] = [
    `${name} est référencé comme ${catLower} à ${cityName}${deptName ? ` (${deptName})` : ""} sur Workwave.`,
  ];
  const facts: string[] = [];
  if (pro.siret) facts.push(`immatriculée au répertoire Sirene de l'INSEE sous le SIRET ${pro.siret}`);
  if (year) facts.push(`active depuis ${year}${anc >= 1 ? ` (${anc} ${anc > 1 ? "ans" : "an"} d'activité)` : ""}`);
  if (facts.length > 0) aboutParts.push(`Cette entreprise est ${facts.join(", ")}.`);
  aboutParts.push(
    `Pour comparer les ${catLower}s à ${cityName} et recevoir des devis gratuits, déposez votre projet sur Workwave : la mise en relation est gratuite et sans engagement.`
  );
  const about = aboutParts.join(" ");

  // ── FAQ propre à CETTE entreprise (factuelle + signal AEO/FAQPage) ──
  const faqs: ProFaq[] = [
    {
      question: `Comment contacter ${name} ?`,
      answer: pro.phone
        ? `Les coordonnées de ${name} sont affichées sur cette fiche. Vous pouvez aussi déposer votre projet sur Workwave pour être recontacté par ce ${catLower} et d'autres professionnels de ${cityName}.`
        : `Déposez votre projet sur Workwave (gratuit, 60 secondes) : ${name} et d'autres ${catLower}s de ${cityName} pourront étudier votre demande et vous recontacter.`,
    },
    {
      question: `${name} est-elle une entreprise vérifiée ?`,
      answer: `${name} est une entreprise immatriculée au répertoire Sirene de l'INSEE${pro.siret ? ` (SIRET ${pro.siret})` : ""}${year ? `, active depuis ${year}` : ""}. Workwave ne référence que des entreprises disposant d'un identifiant Sirene valide.`,
    },
  ];

  const sourced = pro.category?.slug ? SOURCED_PRICES[pro.category.slug] : undefined;
  if (sourced && sourced.ranges.length >= 2) {
    const ex = sourced.ranges
      .slice(0, 2)
      .map((r) => `${r.label.toLowerCase()} (${r.range})`)
      .join(", ");
    faqs.push({
      question: `Quels sont les tarifs d'un ${catLower} à ${cityName} ?`,
      answer: `Les tarifs dépendent de la prestation : par exemple ${ex}. Ces fourchettes sont indicatives (sources web ${sourced.retrievedAt}) — demandez un devis à ${name} pour une estimation précise.`,
    });
  }

  faqs.push({
    question: `Comment obtenir un devis de ${name} ?`,
    answer: `Déposez votre projet sur Workwave en 60 secondes (gratuit, sans engagement). ${name} et d'autres ${catLower}s de ${cityName} pourront vous proposer un devis. La plupart des artisans établissent un devis gratuit avant toute intervention.`,
  });

  const sourcesNote =
    `Informations société issues du répertoire Sirene (INSEE)` +
    (sourced ? ` · tarifs indicatifs d'après des sources web (${sourced.retrievedAt})` : "") +
    `.`;

  return { about, faqs, sourcesNote };
}
