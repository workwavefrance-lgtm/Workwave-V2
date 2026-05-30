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
  /** Clé TJM_REFERENCE. Optionnel : les catégories business/créatif n'ont pas
   *  de TJM de référence => le bloc tarifs est masqué (pas de chiffre inventé). */
  tjmKey?: string;
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
  // ─── Business & creative (wave 2 — pas de TJM de reference) ──────────
  {
    slug: "marketing",
    label: "Marketing & Communication",
    noun: "marketing specialists",
    nounSingular: "marketing specialist",
    frCategorySlug: "marketing-communication",
    blurb:
      "SEO, paid acquisition, social, content and growth specialists who help you reach and convert your audience.",
  },
  {
    slug: "finance",
    label: "Finance & Accounting",
    noun: "finance & accounting experts",
    nounSingular: "finance expert",
    frCategorySlug: "finance-comptabilite",
    blurb:
      "Fractional CFOs, financial controllers and accountants who structure your finances and reporting.",
  },
  {
    slug: "legal",
    label: "Legal & Consulting",
    noun: "legal consultants",
    nounSingular: "legal consultant",
    frCategorySlug: "juridique-conseil",
    blurb:
      "Contract, GDPR, IP and corporate-law specialists who secure your business and agreements.",
  },
  {
    slug: "hr",
    label: "HR & Recruiting",
    noun: "HR & recruiting specialists",
    nounSingular: "HR specialist",
    frCategorySlug: "rh-recrutement",
    blurb:
      "Talent acquisition, training and people-ops specialists who help you hire and grow your team.",
  },
  {
    slug: "graphic-design",
    label: "Graphic Design & Branding",
    noun: "graphic designers",
    nounSingular: "graphic designer",
    frCategorySlug: "design-creation",
    blurb:
      "Brand identity, graphic design, illustration and print specialists who shape how your brand looks.",
  },
  {
    slug: "copywriting",
    label: "Writing & Copywriting",
    noun: "writers & copywriters",
    nounSingular: "copywriter",
    frCategorySlug: "redaction-copywriting",
    blurb:
      "Copywriters, ghostwriters and content writers who turn your ideas into clear, persuasive words.",
  },
  {
    slug: "video-production",
    label: "Audiovisual & Media",
    noun: "video & media producers",
    nounSingular: "video producer",
    frCategorySlug: "audiovisuel-medias",
    blurb:
      "Video editors, motion designers, photographers and podcast producers for all your media content.",
  },
  {
    slug: "strategy",
    label: "Strategy & Management",
    noun: "strategy consultants",
    nounSingular: "strategy consultant",
    frCategorySlug: "strategie-management",
    blurb:
      "Strategy, transformation and operations consultants who help you plan and execute with clarity.",
  },
];

const SKILL_MAP = new Map(INTL_SKILLS.map((s) => [s.slug, s]));

export function getIntlSkill(slug: string): IntlSkill | null {
  return SKILL_MAP.get(slug) ?? null;
}

export function allIntlSkillSlugs(): string[] {
  return INTL_SKILLS.map((s) => s.slug);
}

/** Libellés français pour les pages francophones (/ai/monde/[skill]/[ville]). */
export const SKILL_FR: Record<
  string,
  { label: string; noun: string; nounSingular: string }
> = {
  "web-development": { label: "Développement Web", noun: "développeurs web", nounSingular: "développeur web" },
  "ai-engineering": { label: "Intelligence Artificielle", noun: "ingénieurs IA", nounSingular: "ingénieur IA" },
  "cloud-devops": { label: "Cloud & DevOps", noun: "ingénieurs cloud & DevOps", nounSingular: "ingénieur cloud" },
  "data-analytics": { label: "Data & Analytics", noun: "experts data", nounSingular: "data analyst" },
  "product-design": { label: "Design Produit", noun: "designers produit", nounSingular: "designer produit" },
  "no-code-automation": { label: "No-Code & Automatisation", noun: "experts no-code", nounSingular: "expert no-code" },
  marketing: { label: "Marketing & Communication", noun: "experts marketing", nounSingular: "expert marketing" },
  finance: { label: "Finance & Comptabilité", noun: "experts finance", nounSingular: "expert finance" },
  legal: { label: "Juridique & Conseil", noun: "consultants juridiques", nounSingular: "consultant juridique" },
  hr: { label: "RH & Recrutement", noun: "experts RH", nounSingular: "expert RH" },
  "graphic-design": { label: "Design & Création", noun: "graphistes", nounSingular: "graphiste" },
  copywriting: { label: "Rédaction & Copywriting", noun: "rédacteurs", nounSingular: "rédacteur" },
  "video-production": { label: "Audiovisuel & Médias", noun: "monteurs & producteurs vidéo", nounSingular: "monteur vidéo" },
  strategy: { label: "Stratégie & Management", noun: "consultants en stratégie", nounSingular: "consultant en stratégie" },
};
