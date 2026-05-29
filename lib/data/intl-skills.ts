/**
 * Skills internationaux (anglais) ciblés par Workwave AI — Phase C wave 1.
 *
 * Wave 1 = 6 catégories TECH uniquement, car ce sont les seules pour
 * lesquelles on a un TJM de référence (lib/data/tech-tjm-reference.ts). On
 * NE fabrique PAS de chiffres pour les catégories business/créatif (garde-fou
 * CLAUDE.md "NE PAS INVENTER de chiffres"). Wave 2 ajoutera les catégories
 * business avec un template sans bloc TJM (ou des données sourcées).
 *
 * Mapping :
 *   - tjmKey         : clé dans TJM_REFERENCE (EUR/jour base FR).
 *   - frCategorySlug : slug de la catégorie FR (cross-link vers /ai/[slug]).
 *   - noun / nounSingular : pour les titres "Hire [noun] in [City]".
 */

export type IntlSkill = {
  slug: string;
  label: string;
  noun: string; // pluriel, ex. "web developers"
  nounSingular: string; // ex. "web developer"
  tjmKey: string; // clé TJM_REFERENCE
  frCategorySlug: string; // catégorie FR équivalente
  blurb: string;
};

export const INTL_SKILLS: IntlSkill[] = [
  {
    slug: "web-development",
    label: "Web Development",
    noun: "web developers",
    nounSingular: "web developer",
    tjmKey: "developpement-web",
    frCategorySlug: "developpement-web",
    blurb:
      "Front-end, back-end and full-stack engineers working with React, Next.js, Vue, Node.js and modern web stacks.",
  },
  {
    slug: "ai-engineering",
    label: "AI Engineering",
    noun: "AI engineers",
    nounSingular: "AI engineer",
    tjmKey: "intelligence-artificielle",
    frCategorySlug: "intelligence-artificielle",
    blurb:
      "Specialists in LLMs, RAG pipelines, AI agents, fine-tuning, computer vision and machine-learning systems.",
  },
  {
    slug: "cloud-devops",
    label: "Cloud & DevOps",
    noun: "cloud & DevOps engineers",
    nounSingular: "cloud engineer",
    tjmKey: "cloud-devops",
    frCategorySlug: "cloud-devops",
    blurb:
      "Engineers building and operating infrastructure on AWS, GCP and Azure with Kubernetes, Terraform and CI/CD.",
  },
  {
    slug: "data-analytics",
    label: "Data & Analytics",
    noun: "data & analytics experts",
    nounSingular: "data analyst",
    tjmKey: "data-analytics",
    frCategorySlug: "data-analytics",
    blurb:
      "Data engineers, BI analysts and ML engineers building pipelines, dashboards and analytics platforms.",
  },
  {
    slug: "product-design",
    label: "Product Design",
    noun: "product designers",
    nounSingular: "product designer",
    tjmKey: "design-produit",
    frCategorySlug: "design-produit",
    blurb:
      "UX/UI and product designers building design systems, prototypes and end-to-end product experiences in Figma.",
  },
  {
    slug: "no-code-automation",
    label: "No-Code & Automation",
    noun: "no-code & automation experts",
    nounSingular: "no-code expert",
    tjmKey: "no-code-automation",
    frCategorySlug: "no-code-automation",
    blurb:
      "Builders shipping apps and workflows fast with Bubble, Webflow, Make, Zapier and Airtable.",
  },
];

const SKILL_MAP = new Map(INTL_SKILLS.map((s) => [s.slug, s]));

export function getIntlSkill(slug: string): IntlSkill | null {
  return SKILL_MAP.get(slug) ?? null;
}

export function allIntlSkillSlugs(): string[] {
  return INTL_SKILLS.map((s) => s.slug);
}
