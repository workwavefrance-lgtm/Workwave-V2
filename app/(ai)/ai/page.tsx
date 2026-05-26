import type { Metadata } from "next";
import Link from "next/link";
import { AiFaqSection, type FaqItem } from "@/components/ai/AiFaqSection";

/**
 * Landing /ai (Workwave AI) — style Pixel Rise (validee Willy 25/05).
 *
 * Structure 7 sections :
 *   [1/7] Hero (watermark, socials, scroll)
 *   [2/7] Comment ca marche (3 etapes numerotees)
 *   [3/7] Categories tech (6 cards)
 *   [4/7] Pourquoi Workwave AI (4 differentiators)
 *   [5/7] TJM par technologie (teaser barometre)
 *   [6/7] FAQ (8 questions strategiques SEO/AEO)
 *   [7/7] Freelance + CTA final
 *
 * Schemas JSON-LD injectes : Organization + WebSite (SearchAction) +
 * ItemList des 6 categories. La FAQ rend son propre FAQPage schema via
 * AiFaqSection.
 *
 * Aucun composant BTP. Tokens .ai-theme scopes.
 */

const SITE_URL = "https://workwave.fr";

export const metadata: Metadata = {
  title:
    "Workwave AI — La plateforme freelance de reference (tech, marketing, finance, design, juridique)",
  description:
    "Publiez votre projet et alertez en temps reel toute la communaute des freelances FR : tech (IA, dev, cloud, data), marketing & com, finance & compta, juridique, RH, design & creation, audiovisuel, redaction. Inscription gratuite, sans commission, sans engagement.",
  alternates: { canonical: `${SITE_URL}/ai` },
  openGraph: {
    title: "Workwave AI — La plateforme freelance de reference",
    description:
      "Postez votre projet (tech, marketing, finance, juridique, design, RH...), alertez la communaute des freelances FR en temps reel. Gratuit, sans commission.",
    url: `${SITE_URL}/ai`,
    siteName: "Workwave AI",
    locale: "fr_FR",
    type: "website",
  },
};

// ─────────────────────────────────────────────────────────────────────
// FAQ — 8 questions strategiques (SEO + AEO + GEO)
// ─────────────────────────────────────────────────────────────────────
const FAQ: FaqItem[] = [
  {
    q: "Comment fonctionne Workwave AI pour trouver un freelance ?",
    a: "Vous decrivez votre projet en 60 secondes (categorie, contexte, budget, delai). Notre IA qualifie votre demande (categorie, resume, mots-cles) puis on alerte en temps reel par email TOUTE la communaute des freelances tech inscrits sur Workwave. Les freelances qui correspondent a votre besoin vous contactent directement par mail ou telephone. Pas d'intermediaire, pas de commission, vous gardez le controle des echanges.",
  },
  {
    q: "C'est gratuit pour les clients ?",
    a: "Oui, 100% gratuit. Deposer un projet, etre contacte par les freelances, signer un devis : tout est gratuit cote client. Workwave ne prend aucune commission sur la mission. Les freelances financent la plateforme via un abonnement optionnel de 29,90€/mois TTC qui leur permet de repondre aux projets publies.",
  },
  {
    q: "Quels metiers sont couverts par Workwave AI ?",
    a: "14 categories au total, tech et hors-tech. Cote tech (6 categories) : Intelligence Artificielle (LLM, RAG, agents, fine-tuning, vision), Developpement Web (React, Next.js, Vue, full-stack, mobile), Cloud & DevOps (AWS, GCP, Azure, Kubernetes, Terraform), No-Code & Automation (Bubble, Make, Zapier, Airtable, Webflow), Data & Analytics (BI, ETL, ML engineering, data science), Design Produit (UX/UI, design system, Figma). Cote business et creatif (8 categories) : Marketing & Communication (SEO, SEA, social, growth, content), Strategie & Management (consulting, transformation, ops), Finance & Comptabilite (DAF a temps partage, controle de gestion, expertise comptable), Juridique & Conseil (avocats, contrats, RGPD, propriete intellectuelle), RH & Recrutement (talent acquisition, formation, paie), Redaction & Copywriting (ghostwriting, SEO, technique, scripts), Audiovisuel & Medias (montage, motion, photo, podcasts), Design & Creation (graphisme, branding, illustration, print). Plus de 100 000 profils freelances inscrits, sourcing direct INSEE Sirene.",
  },
  {
    q: "En combien de temps est-on contacte par les freelances ?",
    a: "Sous 24h dans 90% des cas, souvent en quelques heures. Des qu'un freelance Premium voit votre projet correspondant a son savoir-faire dans son dashboard, il peut vous contacter directement. Plus votre brief est clair (techno, budget, delai), plus les freelances pertinents repondent vite.",
  },
  {
    q: "Quel est le TJM moyen d'un freelance tech en France en 2026 ?",
    a: "Selon notre barometre TJM (donnees Blog du Moderateur, Free-Work, Comet) : developpeur web React junior 350-500€/j, senior 600-850€/j ; ingenieur IA/ML junior 500-700€/j, senior 800-1200€/j ; DevOps junior 450-600€/j, senior 700-1000€/j. Paris ajoute generalement +10-20%. Le tarif final depend de la stack, de la duree de la mission et de la complexite du projet.",
  },
  {
    q: "Le freelance travaille en remote ou en presentiel ?",
    a: "Au choix. 80% de notre base travaille en 100% remote (la norme dans la tech francaise depuis 2020), 15% en hybride (remote + bureau client 1-2 jours/semaine), 5% sur site uniquement. Vous precisez vos contraintes (geo, presentiel obligatoire ou pas) dans le formulaire de depot — chaque freelance verra ces criteres dans son dashboard et choisira si le projet l'interesse.",
  },
  {
    q: "Qui sont les freelances references sur Workwave AI ?",
    a: "Freelances et micro-entreprises basees en France et en Europe (UE + UK), enregistres a l'INSEE (SIRET valide), tech et hors-tech. Nous referencons aujourd'hui plus de 100 000 profils issus de la base Sirene avec codes NAF tech (62.01Z, 62.02A, 73.11Z, 70.22Z) et business/creatif (70.21Z communication, 73.11Z conseil marketing, 69.10Z juridique, 69.20Z comptabilite, 78.10Z RH, 90.03A creation artistique, 59.11C audiovisuel, etc.). Chaque freelance peut reclamer sa fiche pour la completer (bio, stack, TJM indicatif, portfolio, lien GitHub ou Behance).",
  },
  {
    q: "Comment Workwave AI se differencie de Malt, Comet, Free-Work ?",
    a: "3 differences majeures : (1) Modele communaute : votre projet est diffuse en temps reel a TOUS les freelances inscrits (tech + business + creatif), ils choisissent ceux qu'ils veulent vous proposer (vs recherche manuelle dans des listes de centaines de profils chez Malt). (2) Aucune commission Workwave sur la mission, vs 10-15% chez Malt/Comet — vous payez le freelance directement, prix transparent. (3) Modele freemium pour les freelances (29,90€/mois sans credits limites, vs systeme de credits chez Codeur ou commission Malt). Resultat : meilleur prix pour vous et pour le freelance.",
  },
];

// ─────────────────────────────────────────────────────────────────────
// PERSONAS — 4 profils types de porteurs de projet
// ─────────────────────────────────────────────────────────────────────
const PERSONAS = [
  {
    icon: "01",
    title: "Startup early-stage",
    pitch: "Vous lancez votre MVP",
    desc: "Besoin d'un freelance polyvalent (full-stack + un peu de DevOps) pour une mission de 1-3 mois. Budget serre, vitesse critique.",
    examples: "MVP SaaS B2B, app mobile MVP, prototype IA",
  },
  {
    icon: "02",
    title: "Scale-up Series A/B",
    pitch: "Vous montez en charge",
    desc: "Besoin de specialistes seniors (architecte cloud, ML engineer, designer produit) pour completer votre equipe interne sur des chantiers de 3-12 mois.",
    examples: "Migration AWS, equipe data, refonte design system",
  },
  {
    icon: "03",
    title: "Agence digitale / ESN",
    pitch: "Vous renforcez vos equipes",
    desc: "Besoin d'overflow ponctuel ou de skills rares (Next.js, LLM, Rust) pour repondre a un appel d'offres ou un pic d'activite client.",
    examples: "Renfort regie client, expertise pointue 1-2 jours/semaine",
  },
  {
    icon: "04",
    title: "Direction metier / TPE",
    pitch: "Vous portez un projet interne",
    desc: "Pas de DSI, besoin d'un freelance fiable pour livrer un projet defini (site, automation, dashboard) en autonomie complete.",
    examples: "Site vitrine pro, automation Make/Zapier, dashboard Looker",
  },
];

// ─────────────────────────────────────────────────────────────────────
// VS CONCURRENTS — comparatif synthetique (verifie public)
// ─────────────────────────────────────────────────────────────────────
const VS_COMPETITORS = [
  {
    feature: "Selection automatique IA",
    workwave: "Oui (24h)",
    malt: "Non (recherche manuelle)",
    comet: "Non (curation humaine)",
    freeWork: "Non (annonces)",
    workwaveBest: true,
  },
  {
    feature: "Commission sur la mission",
    workwave: "0%",
    malt: "10% jusqu'a 5K€",
    comet: "10-15%",
    freeWork: "0%",
    workwaveBest: true,
  },
  {
    feature: "Abonnement freelance",
    workwave: "29,90€/mois fixe",
    malt: "12€/mois Premium",
    comet: "Aucun (commission)",
    freeWork: "29€/mois Premium",
    workwaveBest: false,
  },
  {
    feature: "Systeme de credits",
    workwave: "Aucun",
    malt: "Aucun",
    comet: "Aucun",
    freeWork: "Aucun",
    workwaveBest: false,
  },
  {
    feature: "Couverture France + Europe",
    workwave: "Oui",
    malt: "Oui",
    comet: "France majoritaire",
    freeWork: "France majoritaire",
    workwaveBest: false,
  },
  {
    feature: "Verticaux couverts",
    workwave: "Tech + business + creatif",
    malt: "Multi-vertical",
    comet: "Tech + Data",
    freeWork: "Tech uniquement",
    workwaveBest: true,
  },
];

// ─────────────────────────────────────────────────────────────────────
// MAILLAGE FOOTER — top skills + villes + ressources
// ─────────────────────────────────────────────────────────────────────
const FOOTER_SKILLS = [
  { name: "React", slug: "react" },
  { name: "Next.js", slug: "nextjs" },
  { name: "Python", slug: "python" },
  { name: "TypeScript", slug: "typescript" },
  { name: "Vue.js", slug: "vuejs" },
  { name: "Node.js", slug: "nodejs" },
  { name: "AWS", slug: "aws" },
  { name: "GCP", slug: "gcp" },
  { name: "Kubernetes", slug: "kubernetes" },
  { name: "Docker", slug: "docker" },
  { name: "Terraform", slug: "terraform" },
  { name: "CI/CD", slug: "cicd" },
  { name: "LangChain", slug: "langchain" },
  { name: "OpenAI API", slug: "openai" },
  { name: "Claude API", slug: "claude" },
  { name: "Pinecone", slug: "pinecone" },
  { name: "PyTorch", slug: "pytorch" },
  { name: "TensorFlow", slug: "tensorflow" },
  { name: "PostgreSQL", slug: "postgresql" },
  { name: "MongoDB", slug: "mongodb" },
  { name: "Redis", slug: "redis" },
  { name: "GraphQL", slug: "graphql" },
  { name: "React Native", slug: "react-native" },
  { name: "Flutter", slug: "flutter" },
  { name: "Bubble", slug: "bubble" },
  { name: "Make (Integromat)", slug: "make" },
  { name: "n8n", slug: "n8n" },
  { name: "Airtable", slug: "airtable" },
  { name: "Figma", slug: "figma" },
  { name: "Tailwind CSS", slug: "tailwind" },
];

const FOOTER_CITIES = [
  "paris",
  "lyon",
  "marseille",
  "toulouse",
  "bordeaux",
  "nantes",
  "strasbourg",
  "lille",
  "nice",
  "rennes",
  "montpellier",
  "grenoble",
];

// ─────────────────────────────────────────────────────────────────────
// TJM teaser — top 8 skills avec fourchette TJM senior (source: barometre)
// Donnees verifiees vs lib/data/tech-tjm-reference.ts
// ─────────────────────────────────────────────────────────────────────
const TJM_TEASER = [
  { skill: "react", name: "React", min: 550, max: 850 },
  { skill: "nextjs", name: "Next.js", min: 600, max: 900 },
  { skill: "python", name: "Python", min: 500, max: 800 },
  { skill: "ia-llm", name: "IA / LLM", min: 700, max: 1200 },
  { skill: "aws", name: "AWS", min: 650, max: 1000 },
  { skill: "kubernetes", name: "Kubernetes", min: 700, max: 1100 },
  { skill: "data-engineering", name: "Data Engineering", min: 600, max: 950 },
  { skill: "figma", name: "Design Figma", min: 450, max: 750 },
];

// ─────────────────────────────────────────────────────────────────────
// Section helper : indicateur de pagination + label + titre H2
// ─────────────────────────────────────────────────────────────────────
function SectionLabel({
  index,
  total,
  label,
}: {
  index: number;
  total: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <span
        className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)]"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        [ {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")} ]
      </span>
      <span className="h-px flex-1 max-w-[40px] bg-[var(--ai-border)]" />
      <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-text)]">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    n: "01",
    title: "Decrivez votre projet",
    desc: "On vous pose 4 questions simples : objectif, technos, budget, delai. 60 secondes, pas de formulaire interminable.",
  },
  {
    n: "02",
    title: "On alerte la communaute en temps reel",
    desc: "Notre IA qualifie votre brief (categorie, mots-cles) puis on envoie un mail a tous les freelances inscrits sur Workwave correspondant a votre vertical.",
  },
  {
    n: "03",
    title: "Les freelances pertinents vous contactent",
    desc: "Ceux qui correspondent a votre besoin vous repondent directement. Echange en direct sans intermediaire. Devis et paiement 100% libre, aucune commission Workwave.",
  },
];

const CATEGORIES = [
  // ─── Tech (6 categories) ───
  {
    slug: "intelligence-artificielle",
    name: "Intelligence Artificielle",
    skills: "LLM, RAG, agents, fine-tuning, vision",
    count: 18,
    group: "tech" as const,
  },
  {
    slug: "developpement-web",
    name: "Developpement Web",
    skills: "React, Next.js, Vue, full-stack, mobile",
    count: 32,
    group: "tech" as const,
  },
  {
    slug: "cloud-devops",
    name: "Cloud & DevOps",
    skills: "AWS, GCP, Azure, Kubernetes, CI/CD",
    count: 21,
    group: "tech" as const,
  },
  {
    slug: "no-code-automation",
    name: "No-Code & Automation",
    skills: "Bubble, Make, Zapier, Airtable, Webflow",
    count: 14,
    group: "tech" as const,
  },
  {
    slug: "data-analytics",
    name: "Data & Analytics",
    skills: "BI, ETL, ML engineering, data science",
    count: 19,
    group: "tech" as const,
  },
  {
    slug: "design-produit",
    name: "Design Produit",
    skills: "UX/UI, prototypage, design system, Figma",
    count: 16,
    group: "tech" as const,
  },
  // ─── Business & Creatif (8 categories) ───
  {
    slug: "marketing-communication",
    name: "Marketing & Communication",
    skills: "SEO, SEA, social, growth, brand, content",
    count: 18,
    group: "business" as const,
  },
  {
    slug: "strategie-management",
    name: "Strategie & Management",
    skills: "Consulting, transformation, ops, lean",
    count: 121,
    group: "business" as const,
  },
  {
    slug: "finance-comptabilite",
    name: "Finance & Comptabilite",
    skills: "DAF a temps partage, controle de gestion, expertise comptable",
    count: 14,
    group: "business" as const,
  },
  {
    slug: "juridique-conseil",
    name: "Juridique & Conseil",
    skills: "Avocats, contrats, RGPD, propriete intellectuelle",
    count: 65,
    group: "business" as const,
  },
  {
    slug: "rh-recrutement",
    name: "RH & Recrutement",
    skills: "Talent acquisition, formation, paie, SIRH",
    count: 1,
    group: "business" as const,
  },
  {
    slug: "redaction-copywriting",
    name: "Redaction & Copywriting",
    skills: "Ghostwriting, SEO, technique, scripts, edito",
    count: 20,
    group: "creatif" as const,
  },
  {
    slug: "audiovisuel-medias",
    name: "Audiovisuel & Medias",
    skills: "Montage, motion, photo, podcasts, video",
    count: 56,
    group: "creatif" as const,
  },
  {
    slug: "design-creation",
    name: "Design & Creation",
    skills: "Graphisme, branding, illustration, print",
    count: 64,
    group: "creatif" as const,
  },
];

const WHY = [
  {
    title: "Broadcast a la communaute",
    desc: "Votre projet est diffuse en temps reel a la communaute des freelances FR de votre vertical (tech, marketing, finance, juridique, RH, design, creation, audiovisuel). Reponse en moins de 24h, sans paperasse.",
  },
  {
    title: "Inscription gratuite",
    desc: "Aucun frais cote porteur de projet. Vos briefs sont publies et matches en moins de 24h, sans engagement.",
  },
  {
    title: "Sans credit, sans commission",
    desc: "Les freelances paient 29,90€/mois pour repondre, sans systeme de credits limites. Workwave ne prend aucune commission sur vos missions.",
  },
  {
    title: "France & Europe",
    desc: "Freelances francophones, anglophones, allemands, espagnols. Travail a distance ou hybride selon vos besoins.",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────
export default function AiHomePage() {
  // ── JSON-LD : Organization (entite Workwave AI) ────────────────────
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Workwave AI",
    alternateName: "Workwave",
    url: `${SITE_URL}/ai`,
    logo: `${SITE_URL}/logo-workwave-ai.svg`,
    description:
      "Plateforme francaise de mise en relation IA entre porteurs de projet et freelances multi-verticaux : tech (IA, dev, cloud, data, no-code, design produit), marketing & communication, finance & comptabilite, juridique & conseil, RH & recrutement, redaction & copywriting, audiovisuel & medias, design & creation. Broadcast communaute en temps reel. Sans commission.",
    foundingDate: "2026",
    areaServed: { "@type": "Place", name: "France et Europe" },
    sameAs: [
      "https://www.linkedin.com/company/workwave-fr",
      "https://twitter.com/workwave_fr",
      "https://www.instagram.com/workwave.fr",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "contact@workwave.fr",
      availableLanguage: ["French", "English"],
    },
  };

  // ── JSON-LD : WebSite avec SearchAction (sitelinks searchbox) ──────
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Workwave AI",
    url: `${SITE_URL}/ai`,
    inLanguage: "fr-FR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/ai/freelances?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // ── JSON-LD : ItemList des 6 categories (couverture metiers) ───────
  const categoriesItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Categories freelances (tech + business + creatif) disponibles sur Workwave AI",
    numberOfItems: CATEGORIES.length,
    itemListElement: CATEGORIES.map((cat, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${SITE_URL}/ai/${cat.slug}`,
      name: cat.name,
      description: cat.skills,
    })),
  };

  return (
    <>
      {/* JSON-LD schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categoriesItemList) }}
      />
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1/5 — HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Socials flottantes verticales droite (xl+ only pour eviter overlap col droite a lg) */}
        <aside
          className="hidden xl:flex flex-col gap-3 absolute right-6 top-1/2 -translate-y-1/2 z-20"
          aria-label="Reseaux sociaux"
        >
          {[
            {
              href: "https://www.linkedin.com/company/workwave-fr",
              label: "LinkedIn",
              path: "M4.98 3.5C4.98 4.881 3.87 6 2.5 6S0 4.881 0 3.5 1.119 1 2.5 1s2.48 1.119 2.48 2.5zM0 24h5V8H0v16zm7.5-16H12.3v2.2h.069c.665-1.26 2.291-2.586 4.717-2.586C22.21 7.614 24 10.952 24 15.295V24h-5v-7.83c0-1.864-.034-4.263-2.598-4.263-2.601 0-3 2.031-3 4.13V24h-5V8z",
            },
            {
              href: "https://twitter.com/workwave_fr",
              label: "X",
              path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
            },
            {
              href: "https://www.instagram.com/workwave.fr",
              label: "Instagram",
              path: "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z",
            },
          ].map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="w-9 h-9 rounded-md bg-[var(--ai-bg-card)] border border-[var(--ai-border)] flex items-center justify-center text-[var(--ai-text-secondary)] hover:text-[var(--ai-text)] hover:border-[var(--ai-text)] transition-colors duration-150"
              aria-label={social.label}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d={social.path} />
              </svg>
            </a>
          ))}
        </aside>

        {/* Watermark giant text */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-x-0 bottom-0 z-0 overflow-hidden"
        >
          <span
            className="block font-black uppercase whitespace-nowrap leading-none tracking-[-0.05em]"
            style={{
              fontSize: "clamp(80px, 17vw, 260px)",
              color: "var(--ai-text-watermark)",
              transform: "translateY(15%)",
            }}
          >
            WORKWAVE.AI
          </span>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-8">
              {/* Pagination + trust badge */}
              <div className="flex items-center gap-4 mb-8 sm:mb-12">
                <span
                  className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)]"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  [ 01 / 09 ]
                </span>
                <span className="h-px flex-1 max-w-[60px] bg-[var(--ai-border)]" />
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-accent)]">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
                  France & Europe
                </span>
              </div>

              <h1
                className="font-black text-[var(--ai-text)] uppercase mb-8"
                style={{
                  fontSize: "clamp(36px, 7vw, 88px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.05em",
                }}
              >
                La plateforme
                <br />
                freelance
                <br />
                <span className="text-[var(--ai-text-tertiary)]">
                  de reference.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] max-w-xl leading-relaxed mb-10">
                Publiez votre projet (tech, marketing, finance, juridique, RH,
                design, creation, audiovisuel) et alertez en temps reel toute la
                communaute des freelances FR. Inscription gratuite, sans
                commission, sans engagement.
              </p>

              {/* CTA bar composite (search-bar look, single click target,
                  style Codeur "Recevoir des devis" mais en brand Pixel Rise) */}
              <Link
                href="/ai/deposer"
                className="group flex flex-col sm:flex-row items-stretch bg-[var(--ai-bg-card)] border-2 border-[var(--ai-border-strong)] rounded-2xl overflow-hidden hover:border-[var(--ai-text)] hover:-translate-y-1 hover:shadow-2xl transition-all duration-200 max-w-3xl"
                style={{ boxShadow: "var(--ai-shadow-lg)" }}
                aria-label="Deposer un projet — formulaire en 4 etapes"
              >
                {/* Hint text (left) — XL */}
                <div className="flex-1 flex items-center gap-4 px-6 py-6 sm:py-7 min-w-0">
                  <div
                    className="grid grid-cols-2 grid-rows-2 gap-[3px] w-7 h-7 flex-shrink-0 transition-transform duration-200 group-hover:rotate-90"
                    aria-hidden="true"
                  >
                    <div className="bg-[var(--ai-accent)] rounded-[2px]" />
                    <div className="bg-[var(--ai-text)] rounded-[2px]" />
                    <div className="bg-[var(--ai-text)] rounded-[2px]" />
                    <div className="bg-[var(--ai-accent)] rounded-[2px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[16px] sm:text-[18px] font-bold text-[var(--ai-text)] truncate tracking-tight">
                      Decrivez votre projet
                    </p>
                    <p className="text-[12px] sm:text-[13px] text-[var(--ai-text-secondary)] mt-0.5">
                      Matching IA en moins de 24h — gratuit, sans credit
                    </p>
                  </div>
                </div>

                {/* Orange CTA (right) — XL */}
                <div className="flex items-center justify-center gap-2.5 bg-[var(--ai-accent)] group-hover:bg-[var(--ai-accent-hover)] text-white px-7 sm:px-9 py-5 sm:py-0 transition-colors duration-200">
                  <span className="text-[15px] sm:text-[16px] font-bold whitespace-nowrap tracking-tight">
                    Deposer un projet
                  </span>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </Link>

              {/* Secondary link */}
              <Link
                href="/ai/freelances"
                className="inline-flex items-center gap-1.5 mt-5 text-[14px] font-medium text-[var(--ai-text-secondary)] hover:text-[var(--ai-text)] transition-colors duration-150"
              >
                Ou voir les freelances disponibles
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M7 17L17 7M17 7H9M17 7V15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>

            {/* Stat block droite */}
            <div className="lg:col-span-4 lg:pt-2 space-y-10">
              <div>
                <div className="flex items-baseline gap-3 mb-3">
                  <svg
                    className="w-6 h-6 text-[var(--ai-accent)] flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    style={{ transform: "translateY(2px)" }}
                  >
                    <path
                      d="M7 17L17 7M17 7H9M17 7V15"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    className="text-4xl sm:text-5xl font-black text-[var(--ai-text)] tracking-tight"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    &lt; 24h
                  </span>
                </div>
                <p
                  className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
                  style={{ letterSpacing: "0.18em" }}
                >
                  Broadcast communaute
                </p>
                <p className="text-sm text-[var(--ai-text-secondary)] leading-relaxed">
                  On alerte en temps reel la communaute des freelances FR
                  (tech, marketing, finance, juridique, RH, design, creation).
                  Reponse en moins de 24h, gratuit, sans engagement.
                </p>
              </div>

              {/* Bullet list cache sur mobile/tablet (redondant avec Section 4) */}
              <div className="hidden lg:block border-t border-[var(--ai-border-subtle)] pt-8">
                <p
                  className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-4"
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    letterSpacing: "0.2em",
                  }}
                >
                  {"// Pourquoi nous"}
                </p>
                <ul className="text-[13px] text-[var(--ai-text-secondary)] space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--ai-accent)] mt-0.5">→</span>
                    Inscription gratuite cote client
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--ai-accent)] mt-0.5">→</span>
                    Aucun systeme de credits
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--ai-accent)] mt-0.5">→</span>
                    Aucune commission Workwave
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--ai-accent)] mt-0.5">→</span>
                    France, Europe et remote
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator bottom center */}
        <div
          aria-hidden="true"
          className="hidden lg:flex flex-col items-center gap-2 absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        >
          <div className="w-8 h-8 rounded-full bg-[var(--ai-bg-card)] border border-[var(--ai-border)] flex items-center justify-center">
            <svg
              className="w-3.5 h-3.5 text-[var(--ai-text-tertiary)]"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 5v14M5 12l7 7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span
            className="text-[10px] font-medium text-[var(--ai-text-tertiary)] uppercase"
            style={{ letterSpacing: "0.2em" }}
          >
            Scroll
          </span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2/5 — COMMENT CA MARCHE
          ═══════════════════════════════════════════════════════════════ */}
      <section
        id="methode"
        className="bg-[var(--ai-bg-card)] border-t border-[var(--ai-border-subtle)] scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
          <div className="max-w-2xl mb-12 sm:mb-16">
            <SectionLabel index={2} total={9} label="Methode" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase"
              style={{
                fontSize: "clamp(32px, 5vw, 64px)",
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
              }}
            >
              3 etapes pour
              <br />
              trouver votre
              <br />
              <span className="text-[var(--ai-text-tertiary)]">freelance.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="bg-[var(--ai-bg)] border border-[var(--ai-border-subtle)] rounded-2xl p-8 hover:border-[var(--ai-text)] transition-colors duration-200"
              >
                <span
                  className="block text-5xl font-black text-[var(--ai-accent)] mb-6 tracking-tight"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {step.n}
                </span>
                <h3 className="text-lg font-bold text-[var(--ai-text)] mb-3 leading-tight tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--ai-text-secondary)] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA inline post-3-cards (user feedback : "ici faut cta aussi") */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 sm:mt-16">
            <Link
              href="/ai/deposer"
              className="group inline-flex items-center justify-center h-14 px-8 text-[15px] sm:text-[16px] font-bold rounded-xl bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-all duration-200 hover:-translate-y-0.5 w-full sm:w-auto"
              style={{ boxShadow: "var(--ai-shadow-md)" }}
            >
              Commencer maintenant
              <svg
                className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="/ai/freelances"
              className="inline-flex items-center justify-center h-14 px-7 text-[15px] font-semibold rounded-xl bg-[var(--ai-secondary)] hover:bg-[var(--ai-secondary-hover)] text-[var(--ai-secondary-text)] border border-[var(--ai-secondary-border)] transition-colors w-full sm:w-auto"
            >
              Parcourir les freelances
            </Link>
          </div>

          <p className="text-center text-[12px] text-[var(--ai-text-tertiary)] mt-4">
            Gratuit · sans engagement · sans carte bancaire
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3/5 — CATEGORIES TECH
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg)] border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12 sm:mb-16">
            <div className="max-w-2xl">
              <SectionLabel index={3} total={9} label="Categories" />
              <h2
                className="font-black text-[var(--ai-text)] uppercase"
                style={{
                  fontSize: "clamp(32px, 5vw, 64px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.04em",
                }}
              >
                14 verticaux,
                <br />
                100 000+
                <br />
                <span className="text-[var(--ai-text-tertiary)]">freelances.</span>
              </h2>
              <p className="text-base text-[var(--ai-text-secondary)] mt-6 max-w-md leading-relaxed">
                Du dev senior au DAF a temps partage, en passant par les
                avocats, les graphistes ou les rédacteurs : Workwave couvre les
                14 verticaux freelance qui comptent en France.
              </p>
            </div>
            <Link
              href="/ai/freelances"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ai-text)] hover:text-[var(--ai-accent)] transition-colors duration-150 self-start lg:self-end"
            >
              Voir tous les freelances
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/ai/${cat.slug}`}
                className="group bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl p-6 hover:border-[var(--ai-text)] transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-6">
                  <div
                    className="grid grid-cols-2 grid-rows-2 gap-[2px] w-6 h-6 transition-transform duration-200 group-hover:rotate-90"
                    aria-hidden="true"
                  >
                    <div className="bg-[var(--ai-accent)] rounded-[2px]" />
                    <div className="bg-[var(--ai-text)] rounded-[2px]" />
                    <div className="bg-[var(--ai-text)] rounded-[2px]" />
                    <div className="bg-[var(--ai-accent)] rounded-[2px]" />
                  </div>
                  <span
                    className="text-[11px] font-medium text-[var(--ai-text-tertiary)] tracking-wider"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {String(cat.count).padStart(2, "0")} pros
                  </span>
                </div>
                <h3 className="text-base font-bold text-[var(--ai-text)] mb-2 leading-tight tracking-tight">
                  {cat.name}
                </h3>
                <p className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed mb-4">
                  {cat.skills}
                </p>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ai-text)] group-hover:text-[var(--ai-accent)] transition-colors">
                  Decouvrir
                  <svg
                    className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4/5 — POURQUOI WORKWAVE AI
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg-card)] border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
          <div className="max-w-2xl mb-12 sm:mb-16">
            <SectionLabel index={4} total={9} label="Pourquoi nous" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase"
              style={{
                fontSize: "clamp(32px, 5vw, 64px)",
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
              }}
            >
              Pas un autre
              <br />
              <span className="text-[var(--ai-text-tertiary)]">
                annuaire.
              </span>
            </h2>
            <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] mt-6 leading-relaxed max-w-lg">
              Codeur.com facture chaque devis. Malt prend une commission de
              10%. Workwave AI ne fait ni l&apos;un ni l&apos;autre.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WHY.map((item, i) => (
              <div
                key={item.title}
                className="bg-[var(--ai-bg)] border border-[var(--ai-border-subtle)] rounded-2xl p-8 hover:border-[var(--ai-text)] transition-colors duration-200"
              >
                <div className="flex items-start gap-4 mb-4">
                  <span
                    className="text-[11px] font-medium text-[var(--ai-text-tertiary)] tracking-wider flex-shrink-0 pt-1"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    [ {String(i + 1).padStart(2, "0")} ]
                  </span>
                  <h3 className="text-xl font-bold text-[var(--ai-text)] leading-tight tracking-tight">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-[var(--ai-text-secondary)] leading-relaxed pl-10">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5/9 — POUR QUI (4 personas)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
          <SectionLabel index={5} total={9} label="Pour qui" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 mb-12">
            <div className="lg:col-span-5">
              <h2
                className="font-black text-[var(--ai-text)] uppercase mb-4"
                style={{
                  fontSize: "clamp(32px, 5vw, 56px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.04em",
                }}
              >
                Qui utilise
                <br />
                <span className="text-[var(--ai-text-tertiary)]">
                  Workwave AI ?
                </span>
              </h2>
              <p className="text-base text-[var(--ai-text-secondary)] leading-relaxed">
                4 profils types de porteurs de projet. La selection IA
                s&apos;adapte a votre contexte : taille d&apos;equipe, niveau
                d&apos;expertise interne, budget, criticite du delai.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PERSONAS.map((p) => (
                  <div
                    key={p.title}
                    className="group flex flex-col gap-2 p-6 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl hover:border-[var(--ai-text)] hover:-translate-y-0.5 transition-all"
                  >
                    <span
                      className="text-[12px] font-bold text-[var(--ai-accent)] mb-2"
                      style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                    >
                      {p.icon}
                    </span>
                    <h3 className="text-[17px] font-bold text-[var(--ai-text)] tracking-tight">
                      {p.title}
                    </h3>
                    <p className="text-[13px] font-semibold text-[var(--ai-accent)] mb-1">
                      {p.pitch}
                    </p>
                    <p className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed mb-2">
                      {p.desc}
                    </p>
                    <p
                      className="text-[11px] text-[var(--ai-text-tertiary)] uppercase tracking-wider mt-auto"
                      style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                    >
                      Ex : {p.examples}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 6/9 — VS CONCURRENTS (comparatif synthetique)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
          <SectionLabel index={6} total={9} label="Vs concurrents" />

          <div className="mb-12 max-w-2xl">
            <h2
              className="font-black text-[var(--ai-text)] uppercase mb-4"
              style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
              }}
            >
              Workwave AI vs
              <br />
              <span className="text-[var(--ai-text-tertiary)]">
                Malt, Comet, Free-Work.
              </span>
            </h2>
            <p className="text-base text-[var(--ai-text-secondary)] leading-relaxed">
              Comparatif synthetique des principales plateformes freelance tech
              francaises en {new Date().getFullYear()}. Sources publiques
              verifiees : pages tarifs officielles + conditions generales.
            </p>
          </div>

          {/* Desktop : table */}
          <div className="hidden md:block bg-[var(--ai-bg)] border border-[var(--ai-border-subtle)] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--ai-border-subtle)]">
                  <th
                    className="text-left px-6 py-5 text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)]"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    Critere
                  </th>
                  <th
                    className="text-left px-6 py-5 text-[11px] uppercase font-semibold text-[var(--ai-accent)]"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    ● Workwave AI
                  </th>
                  <th
                    className="text-left px-6 py-5 text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)]"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    Malt
                  </th>
                  <th
                    className="text-left px-6 py-5 text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)]"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    Comet
                  </th>
                  <th
                    className="text-left px-6 py-5 text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)]"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    Free-Work
                  </th>
                </tr>
              </thead>
              <tbody>
                {VS_COMPETITORS.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={
                      i < VS_COMPETITORS.length - 1
                        ? "border-b border-[var(--ai-border-subtle)]"
                        : ""
                    }
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-[var(--ai-text)]">
                      {row.feature}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm ${
                        row.workwaveBest
                          ? "font-bold text-[var(--ai-text)]"
                          : "text-[var(--ai-text)]"
                      }`}
                    >
                      {row.workwave}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--ai-text-secondary)]">
                      {row.malt}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--ai-text-secondary)]">
                      {row.comet}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--ai-text-secondary)]">
                      {row.freeWork}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile : cards stack */}
          <div className="md:hidden space-y-4">
            {VS_COMPETITORS.map((row) => (
              <div
                key={row.feature}
                className="bg-[var(--ai-bg)] border border-[var(--ai-border-subtle)] rounded-xl p-5"
              >
                <p className="text-sm font-semibold text-[var(--ai-text)] mb-4">
                  {row.feature}
                </p>
                <dl className="space-y-2 text-[13px]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--ai-accent)] font-bold flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
                      Workwave AI
                    </dt>
                    <dd className="text-right text-[var(--ai-text)] font-medium">
                      {row.workwave}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--ai-text-tertiary)]">Malt</dt>
                    <dd className="text-right text-[var(--ai-text-secondary)]">
                      {row.malt}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--ai-text-tertiary)]">Comet</dt>
                    <dd className="text-right text-[var(--ai-text-secondary)]">
                      {row.comet}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--ai-text-tertiary)]">Free-Work</dt>
                    <dd className="text-right text-[var(--ai-text-secondary)]">
                      {row.freeWork}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-[var(--ai-text-tertiary)] mt-6 leading-relaxed">
            Sources : malt.fr/freelancer/legal-conditions, comet.co/conditions,
            free-work.com/tarifs (verifie {new Date().getFullYear()}). Les
            commissions Comet varient selon la duree de la mission.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 7/9 — TJM PAR TECHNOLOGIE (teaser barometre)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
          <SectionLabel index={7} total={9} label="TJM par stack" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 mb-12">
            <div className="lg:col-span-5">
              <h2
                className="font-black text-[var(--ai-text)] uppercase mb-4"
                style={{
                  fontSize: "clamp(32px, 5vw, 56px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.04em",
                }}
              >
                Combien
                <br />
                <span className="text-[var(--ai-text-tertiary)]">
                  ca coute ?
                </span>
              </h2>
              <p className="text-base text-[var(--ai-text-secondary)] leading-relaxed mb-6">
                Les TJM des freelances tech senior (7+ ans) en France en 2026.
                Donnees agregees de sources publiques (Blog du Moderateur,
                Free-Work, Comet, Malt).
              </p>
              <Link
                href="/ai/barometre-tjm"
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[var(--ai-text)] hover:text-[var(--ai-accent)] transition-colors"
              >
                Voir le barometre complet
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>

            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {TJM_TEASER.map((item) => (
                  <Link
                    key={item.skill}
                    href={`/ai/barometre-tjm/${item.skill}`}
                    className="group flex flex-col gap-1 p-4 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-xl hover:border-[var(--ai-text)] hover:-translate-y-0.5 transition-all"
                  >
                    <span className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] tracking-wider">
                      {item.name}
                    </span>
                    <span
                      className="text-[15px] sm:text-[16px] font-bold text-[var(--ai-text)] tracking-tight"
                      style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                    >
                      {item.min}-{item.max}€
                    </span>
                    <span className="text-[10px] text-[var(--ai-text-tertiary)]">
                      /jour · senior
                    </span>
                  </Link>
                ))}
              </div>
              <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-4 leading-relaxed">
                Source : barometre TJM Workwave AI 2026. Fourchettes indicatives
                pour profils senior (7-10 ans d&apos;experience).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 6/7 — FAQ (FAQPage schema via AiFaqSection)
          ═══════════════════════════════════════════════════════════════ */}
      <AiFaqSection
        id="faq"
        title="Questions frequentes"
        subtitle="Tout ce qu'il faut savoir sur Workwave AI avant de deposer un projet ou de creer votre profil freelance."
        questions={FAQ}
        sectionIndex={8}
        sectionTotal={9}
        sectionLabel="FAQ"
      />

      {/* ═══════════════════════════════════════════════════════════════
          MAILLAGE INTERNE — sitelinks dense (skills + villes + ressources)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <p
            className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-8"
            style={{ letterSpacing: "0.2em", fontFamily: "var(--font-geist-mono), monospace" }}
          >
            {"// Explorer Workwave AI"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Col 1 : Categories */}
            <div>
              <h3
                className="text-[13px] font-bold text-[var(--ai-text)] uppercase mb-5 pb-3 border-b border-[var(--ai-border-subtle)]"
                style={{ letterSpacing: "0.08em" }}
              >
                Categories
              </h3>
              <ul className="space-y-2.5">
                {CATEGORIES.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/ai/${cat.slug}`}
                      className="text-[14px] text-[var(--ai-text-secondary)] hover:text-[var(--ai-accent)] transition-colors"
                    >
                      Freelances {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 2 : Stacks barometre TJM */}
            <div>
              <h3
                className="text-[13px] font-bold text-[var(--ai-text)] uppercase mb-5 pb-3 border-b border-[var(--ai-border-subtle)]"
                style={{ letterSpacing: "0.08em" }}
              >
                TJM par stack
              </h3>
              <ul className="grid grid-cols-2 gap-x-2 gap-y-2">
                {FOOTER_SKILLS.slice(0, 18).map((skill) => (
                  <li key={skill.slug}>
                    <Link
                      href={`/ai/barometre-tjm/${skill.slug}`}
                      className="text-[13px] text-[var(--ai-text-secondary)] hover:text-[var(--ai-accent)] transition-colors"
                    >
                      {skill.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/ai/barometre-tjm"
                className="inline-flex items-center gap-1.5 mt-4 text-[12px] font-semibold text-[var(--ai-text)] hover:text-[var(--ai-accent)] transition-colors"
              >
                Voir le barometre complet
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            {/* Col 3 : Villes principales */}
            <div>
              <h3
                className="text-[13px] font-bold text-[var(--ai-text)] uppercase mb-5 pb-3 border-b border-[var(--ai-border-subtle)]"
                style={{ letterSpacing: "0.08em" }}
              >
                Villes principales
              </h3>
              <ul className="grid grid-cols-2 gap-x-2 gap-y-2">
                {FOOTER_CITIES.map((city) => (
                  <li key={city}>
                    <Link
                      href={`/ai/developpement-web/${city}`}
                      className="text-[13px] text-[var(--ai-text-secondary)] hover:text-[var(--ai-accent)] transition-colors capitalize"
                    >
                      Dev {city.replace("-", " ")}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4 : Ressources */}
            <div>
              <h3
                className="text-[13px] font-bold text-[var(--ai-text)] uppercase mb-5 pb-3 border-b border-[var(--ai-border-subtle)]"
                style={{ letterSpacing: "0.08em" }}
              >
                Ressources
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/ai/tarifs" className="text-[14px] text-[var(--ai-text-secondary)] hover:text-[var(--ai-accent)] transition-colors">
                    Tarifs
                  </Link>
                </li>
                <li>
                  <Link href="/ai/pour-les-freelances" className="text-[14px] text-[var(--ai-text-secondary)] hover:text-[var(--ai-accent)] transition-colors">
                    Pour les freelances
                  </Link>
                </li>
                <li>
                  <Link href="/ai/freelances" className="text-[14px] text-[var(--ai-text-secondary)] hover:text-[var(--ai-accent)] transition-colors">
                    Tous les freelances
                  </Link>
                </li>
                <li>
                  <Link href="/ai/barometre-tjm" className="text-[14px] text-[var(--ai-text-secondary)] hover:text-[var(--ai-accent)] transition-colors">
                    Barometre TJM {new Date().getFullYear()}
                  </Link>
                </li>
                <li>
                  <Link href="/ai/deposer" className="text-[14px] text-[var(--ai-text-secondary)] hover:text-[var(--ai-accent)] transition-colors font-semibold text-[var(--ai-text)]">
                    Deposer un projet
                  </Link>
                </li>
                <li>
                  <Link href="/ai/inscription" className="text-[14px] text-[var(--ai-text-secondary)] hover:text-[var(--ai-accent)] transition-colors">
                    Inscription freelance
                  </Link>
                </li>
                <li>
                  <Link href="/ai/connexion" className="text-[14px] text-[var(--ai-text-secondary)] hover:text-[var(--ai-accent)] transition-colors">
                    Connexion
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 9/9 — FREELANCES + CTA FINAL
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg)] border-t border-[var(--ai-border-subtle)] relative overflow-hidden">
        {/* Watermark bottom */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-x-0 bottom-0 z-0 overflow-hidden"
        >
          <span
            className="block font-black uppercase whitespace-nowrap leading-none tracking-[-0.05em]"
            style={{
              fontSize: "clamp(80px, 17vw, 260px)",
              color: "var(--ai-text-watermark)",
              transform: "translateY(20%)",
            }}
          >
            JOIN.WORKWAVE
          </span>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Cote client */}
            <div className="bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl p-8 sm:p-10">
              <SectionLabel index={9} total={9} label="Cote client" />
              <h2
                className="font-black text-[var(--ai-text)] uppercase mb-4"
                style={{
                  fontSize: "clamp(28px, 4vw, 44px)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                Un projet
                <br />a confier ?
              </h2>
              <p className="text-sm text-[var(--ai-text-secondary)] leading-relaxed mb-8">
                Decrivez votre projet en 60 secondes. On vous propose les 3
                freelances qui vous correspondent sous 24h. Gratuit, sans
                engagement.
              </p>
              <Link
                href="/ai/deposer"
                className="inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-[var(--ai-accent-text)] transition-colors duration-150 w-full sm:w-auto"
                style={{ boxShadow: "var(--ai-shadow-sm)" }}
              >
                Deposer un projet
                <svg
                  className="ml-2 w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>

            {/* Cote freelance (dark card) */}
            <div className="bg-[var(--ai-text)] text-white rounded-2xl p-8 sm:p-10 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <span
                  className="text-[11px] font-medium tracking-[0.2em] text-white/40"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  [ FREELANCE ]
                </span>
                <span className="h-px flex-1 max-w-[40px] bg-white/20" />
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-accent)]">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
                  14 verticaux
                </span>
              </div>

              <h2
                className="font-black uppercase mb-4 relative z-10"
                style={{
                  fontSize: "clamp(28px, 4vw, 44px)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                Vous etes
                <br />
                <span className="text-[var(--ai-accent)]">freelance ?</span>
              </h2>
              <p className="text-sm text-white/70 leading-relaxed mb-8 relative z-10">
                Inscription gratuite — tech, marketing, finance, juridique, RH,
                design, creation. Recevez tous les projets de votre vertical en
                temps reel. Repondez sans credit a 29,90€/mois TTC. Resiliable
                a tout moment, aucun engagement.
              </p>

              <Link
                href="/ai/inscription"
                className="inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-white hover:bg-white/90 text-[var(--ai-text)] transition-colors duration-150 w-full sm:w-auto relative z-10"
              >
                S&apos;inscrire gratuitement
                <svg
                  className="ml-2 w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              {/* Grid pattern bg */}
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
