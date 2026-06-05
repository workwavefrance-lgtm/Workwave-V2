/**
 * One-shot : seed 10 macros non-tech + 100 sous-skills dans categories.
 *
 * Avec les 6 macros tech + 30 skills tech deja en base, on aura au total :
 *   6 + 30 + 10 + 100 = 146 categories sous vertical='tech'
 *   146 × 60 villes = 8760 pages SEO programmatiques
 *
 * Tous sous vertical='tech' pour rester dans le namespace /ai/* coherent
 * avec la marque Workwave AI ("freelances tech & creatif & business").
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const popMap = { "very-high": 90, high: 70, medium: 50, low: 30 } as const;

type Macro = { slug: string; name: string; description: string };
type Skill = { slug: string; name: string; parent: string; pop: keyof typeof popMap };

const MACROS: Macro[] = [
  { slug: "marketing-communication", name: "Marketing & Communication", description: "Freelances marketing digital, communication, SEO, SEA, growth, community management." },
  { slug: "design-creation", name: "Design & Creation", description: "Freelances design : UX/UI, graphisme, motion, illustration, identite visuelle." },
  { slug: "strategie-management", name: "Strategie & Management", description: "Consultants strategie, transformation, manager de transition, ESG/RSE." },
  { slug: "finance-comptabilite", name: "Finance & Comptabilite", description: "DAF freelance, controleur de gestion, expert-comptable, M&A, tresorerie." },
  { slug: "rh-recrutement", name: "RH & Recrutement", description: "Consultants RH, talent acquisition, coaching, formation, SIRH." },
  { slug: "commercial-vente", name: "Commercial & Vente", description: "Business developers, sales ops, prospection B2B/B2C, lead generation." },
  { slug: "juridique-conseil", name: "Juridique & Conseil", description: "Avocats freelances, juristes, DPO RGPD, droit des affaires, compliance." },
  { slug: "redaction-copywriting", name: "Redaction & Copywriting", description: "Redacteurs web/SEO, copywriters, content managers, traducteurs, journalistes." },
  { slug: "audiovisuel-medias", name: "Audiovisuel & Medias", description: "Photographes, videastes, monteurs, realisateurs, podcasters." },
  { slug: "supply-chain-operations", name: "Supply Chain & Operations", description: "Consultants supply chain, achats, logistique, ERP, lean management." },
];

const SKILLS: Skill[] = [
  // Marketing & Communication (16)
  { slug: "consultant-seo", name: "Consultant SEO", parent: "marketing-communication", pop: "very-high" },
  { slug: "consultant-sea", name: "Consultant SEA / Google Ads", parent: "marketing-communication", pop: "high" },
  { slug: "consultant-marketing", name: "Consultant marketing", parent: "marketing-communication", pop: "high" },
  { slug: "consultant-webmarketing", name: "Consultant webmarketing", parent: "marketing-communication", pop: "high" },
  { slug: "consultant-analytics", name: "Consultant analytics (GA4)", parent: "marketing-communication", pop: "high" },
  { slug: "growth-hacker", name: "Growth Hacker", parent: "marketing-communication", pop: "high" },
  { slug: "consultant-crm", name: "Consultant CRM / Salesforce", parent: "marketing-communication", pop: "high" },
  { slug: "marketing-automation", name: "Marketing Automation", parent: "marketing-communication", pop: "medium" },
  { slug: "email-marketing", name: "Email Marketing", parent: "marketing-communication", pop: "high" },
  { slug: "community-manager", name: "Community Manager", parent: "marketing-communication", pop: "very-high" },
  { slug: "social-media-manager", name: "Social Media Manager", parent: "marketing-communication", pop: "high" },
  { slug: "brand-manager", name: "Brand Manager", parent: "marketing-communication", pop: "medium" },
  { slug: "directeur-marketing", name: "Directeur Marketing freelance", parent: "marketing-communication", pop: "medium" },
  { slug: "consultant-en-communication", name: "Consultant en communication", parent: "marketing-communication", pop: "high" },
  { slug: "consultant-influence", name: "Consultant influence marketing", parent: "marketing-communication", pop: "medium" },
  { slug: "consultant-acquisition", name: "Consultant acquisition payante", parent: "marketing-communication", pop: "high" },
  // Design & Creation (14)
  { slug: "ux-designer", name: "UX Designer", parent: "design-creation", pop: "very-high" },
  { slug: "ui-designer", name: "UI Designer", parent: "design-creation", pop: "very-high" },
  { slug: "product-designer", name: "Product Designer", parent: "design-creation", pop: "high" },
  { slug: "ux-researcher", name: "UX Researcher", parent: "design-creation", pop: "medium" },
  { slug: "graphiste", name: "Graphiste", parent: "design-creation", pop: "very-high" },
  { slug: "webdesigner", name: "Webdesigner", parent: "design-creation", pop: "high" },
  { slug: "directeur-artistique", name: "Directeur Artistique", parent: "design-creation", pop: "high" },
  { slug: "motion-designer", name: "Motion Designer", parent: "design-creation", pop: "high" },
  { slug: "illustrateur", name: "Illustrateur", parent: "design-creation", pop: "high" },
  { slug: "illustrateur-3d", name: "Illustrateur 3D", parent: "design-creation", pop: "medium" },
  { slug: "identite-visuelle", name: "Identite visuelle / Branding", parent: "design-creation", pop: "high" },
  { slug: "charte-graphique", name: "Charte graphique", parent: "design-creation", pop: "medium" },
  { slug: "graphisme-print", name: "Graphisme print", parent: "design-creation", pop: "medium" },
  { slug: "sound-designer", name: "Sound Designer", parent: "design-creation", pop: "low" },
  // Strategie & Management (10)
  { slug: "consultant-strategie", name: "Consultant en strategie", parent: "strategie-management", pop: "very-high" },
  { slug: "consultant-transformation", name: "Consultant transformation", parent: "strategie-management", pop: "high" },
  { slug: "manager-de-transition", name: "Manager de transition", parent: "strategie-management", pop: "high" },
  { slug: "consultant-operations", name: "Consultant operations", parent: "strategie-management", pop: "medium" },
  { slug: "consultant-organisation", name: "Consultant organisation", parent: "strategie-management", pop: "medium" },
  { slug: "consultant-change-management", name: "Consultant change management", parent: "strategie-management", pop: "medium" },
  { slug: "consultant-innovation", name: "Consultant innovation", parent: "strategie-management", pop: "medium" },
  { slug: "consultant-pmo", name: "Consultant PMO", parent: "strategie-management", pop: "high" },
  { slug: "business-plan", name: "Business plan / Creation entreprise", parent: "strategie-management", pop: "medium" },
  { slug: "consultant-esg-rse", name: "Consultant ESG / RSE", parent: "strategie-management", pop: "medium" },
  // Finance & Comptabilite (10)
  { slug: "daf-freelance", name: "DAF freelance", parent: "finance-comptabilite", pop: "high" },
  { slug: "raf-freelance", name: "RAF (Resp. Administratif & Financier)", parent: "finance-comptabilite", pop: "medium" },
  { slug: "controleur-de-gestion", name: "Controleur de gestion", parent: "finance-comptabilite", pop: "high" },
  { slug: "expert-comptable", name: "Expert-comptable", parent: "finance-comptabilite", pop: "high" },
  { slug: "comptable", name: "Comptable", parent: "finance-comptabilite", pop: "high" },
  { slug: "consultant-tresorerie", name: "Consultant tresorerie", parent: "finance-comptabilite", pop: "medium" },
  { slug: "consultant-m-a", name: "Consultant M&A / Fusions-acquisitions", parent: "finance-comptabilite", pop: "medium" },
  { slug: "analyste-financier", name: "Analyste financier", parent: "finance-comptabilite", pop: "medium" },
  { slug: "consultant-fiscalite", name: "Consultant fiscalite", parent: "finance-comptabilite", pop: "medium" },
  { slug: "comptabilite-analytique", name: "Comptabilite analytique", parent: "finance-comptabilite", pop: "low" },
  // RH & Recrutement (9)
  { slug: "consultant-rh", name: "Consultant RH", parent: "rh-recrutement", pop: "high" },
  { slug: "drh-freelance", name: "DRH freelance", parent: "rh-recrutement", pop: "medium" },
  { slug: "talent-acquisition", name: "Talent Acquisition", parent: "rh-recrutement", pop: "high" },
  { slug: "consultant-recrutement", name: "Consultant recrutement", parent: "rh-recrutement", pop: "very-high" },
  { slug: "consultant-formation", name: "Consultant formation", parent: "rh-recrutement", pop: "high" },
  { slug: "coach-professionnel", name: "Coach professionnel", parent: "rh-recrutement", pop: "high" },
  { slug: "consultant-change-rh", name: "Consultant change management RH", parent: "rh-recrutement", pop: "medium" },
  { slug: "consultant-sirh", name: "Consultant SIRH", parent: "rh-recrutement", pop: "medium" },
  { slug: "consultant-sourcing", name: "Consultant sourcing", parent: "rh-recrutement", pop: "medium" },
  // Commercial & Vente (8)
  { slug: "business-developer", name: "Business Developer", parent: "commercial-vente", pop: "very-high" },
  { slug: "directeur-commercial", name: "Directeur commercial freelance", parent: "commercial-vente", pop: "medium" },
  { slug: "consultant-vente", name: "Consultant vente / Sales", parent: "commercial-vente", pop: "high" },
  { slug: "sales-ops", name: "Sales Ops", parent: "commercial-vente", pop: "medium" },
  { slug: "consultant-prospection-b2b", name: "Consultant prospection B2B", parent: "commercial-vente", pop: "high" },
  { slug: "consultant-prospection-b2c", name: "Consultant prospection B2C", parent: "commercial-vente", pop: "medium" },
  { slug: "closer", name: "Closer commercial", parent: "commercial-vente", pop: "medium" },
  { slug: "lead-generation", name: "Lead Generation", parent: "commercial-vente", pop: "high" },
  // Juridique & Conseil (7)
  { slug: "avocat-freelance", name: "Avocat freelance", parent: "juridique-conseil", pop: "medium" },
  { slug: "juriste-entreprise", name: "Juriste d'entreprise", parent: "juridique-conseil", pop: "high" },
  { slug: "dpo-rgpd", name: "DPO / Expert RGPD", parent: "juridique-conseil", pop: "high" },
  { slug: "consultant-droit-affaires", name: "Consultant droit des affaires", parent: "juridique-conseil", pop: "medium" },
  { slug: "consultant-compliance", name: "Consultant compliance", parent: "juridique-conseil", pop: "medium" },
  { slug: "consultant-propriete-intellectuelle", name: "Consultant Propriete intellectuelle", parent: "juridique-conseil", pop: "low" },
  { slug: "redacteur-juridique", name: "Redacteur juridique CGV / CGU", parent: "juridique-conseil", pop: "medium" },
  // Redaction & Copywriting (10)
  { slug: "redacteur-web", name: "Redacteur web", parent: "redaction-copywriting", pop: "very-high" },
  { slug: "redacteur-seo", name: "Redacteur SEO", parent: "redaction-copywriting", pop: "very-high" },
  { slug: "concepteur-redacteur", name: "Concepteur-redacteur", parent: "redaction-copywriting", pop: "high" },
  { slug: "copywriter", name: "Copywriter", parent: "redaction-copywriting", pop: "very-high" },
  { slug: "ghostwriter", name: "Ghostwriter", parent: "redaction-copywriting", pop: "medium" },
  { slug: "content-manager", name: "Content Manager", parent: "redaction-copywriting", pop: "high" },
  { slug: "responsable-editorial", name: "Responsable editorial", parent: "redaction-copywriting", pop: "medium" },
  { slug: "journaliste", name: "Journaliste", parent: "redaction-copywriting", pop: "medium" },
  { slug: "traducteur", name: "Traducteur", parent: "redaction-copywriting", pop: "high" },
  { slug: "relecteur-correcteur", name: "Relecteur / Correcteur", parent: "redaction-copywriting", pop: "medium" },
  // Audiovisuel & Medias (8)
  { slug: "photographe", name: "Photographe", parent: "audiovisuel-medias", pop: "very-high" },
  { slug: "videaste", name: "Videaste", parent: "audiovisuel-medias", pop: "high" },
  { slug: "monteur-video", name: "Monteur video", parent: "audiovisuel-medias", pop: "high" },
  { slug: "realisateur", name: "Realisateur", parent: "audiovisuel-medias", pop: "medium" },
  { slug: "producteur-audio", name: "Producteur audio / Podcast", parent: "audiovisuel-medias", pop: "medium" },
  { slug: "sous-titreur", name: "Sous-titreur", parent: "audiovisuel-medias", pop: "low" },
  { slug: "operateur-tournage", name: "Operateur de tournage", parent: "audiovisuel-medias", pop: "low" },
  { slug: "film-entreprise", name: "Realisateur film d'entreprise", parent: "audiovisuel-medias", pop: "medium" },
  // Supply Chain & Operations (8)
  { slug: "consultant-supply-chain", name: "Consultant Supply Chain", parent: "supply-chain-operations", pop: "high" },
  { slug: "consultant-logistique", name: "Consultant Logistique", parent: "supply-chain-operations", pop: "medium" },
  { slug: "consultant-achats", name: "Consultant Achats / Procurement", parent: "supply-chain-operations", pop: "medium" },
  { slug: "consultant-gestion-stocks", name: "Consultant Gestion des stocks", parent: "supply-chain-operations", pop: "low" },
  { slug: "consultant-import-export", name: "Consultant Import-Export", parent: "supply-chain-operations", pop: "low" },
  { slug: "consultant-amelioration-continue", name: "Consultant amelioration continue / Lean", parent: "supply-chain-operations", pop: "medium" },
  { slug: "consultant-erp", name: "Consultant ERP (SAP/Oracle)", parent: "supply-chain-operations", pop: "medium" },
];

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Insert 10 macros
  console.log("→ Inserting 10 non-tech macros...");
  const macroPayload = MACROS.map((m) => ({
    slug: m.slug,
    name: m.name,
    vertical: "tech",
    description: m.description,
    parent_category_id: null,
    popularity: 80,
  }));
  const { error: macroErr } = await sb
    .from("categories")
    .upsert(macroPayload, { onConflict: "slug", ignoreDuplicates: false });
  if (macroErr) {
    console.error("❌ Macros error:", macroErr);
    process.exit(1);
  }
  console.log(`✓ ${MACROS.length} macros saved`);

  // 2. Get macro slug → id
  const { data: macroRows } = await sb
    .from("categories")
    .select("id, slug")
    .in("slug", MACROS.map((m) => m.slug));
  const macroId = new Map<string, number>();
  macroRows?.forEach((m) => macroId.set(m.slug, m.id));

  // 3. Insert 100 skills
  console.log(`→ Inserting ${SKILLS.length} non-tech skills...`);
  const skillPayload = SKILLS.map((s) => {
    const parentId = macroId.get(s.parent);
    if (!parentId) {
      console.warn(`⚠ macro '${s.parent}' missing for ${s.slug}`);
      return null;
    }
    return {
      slug: s.slug,
      name: s.name,
      vertical: "tech",
      description: `Freelances ${s.name.toLowerCase()} sur Workwave AI. Matching IA en moins de 24h, inscription gratuite, sans credit.`,
      parent_category_id: parentId,
      popularity: popMap[s.pop],
    };
  }).filter((p): p is NonNullable<typeof p> => p !== null);

  const { error: skillErr } = await sb
    .from("categories")
    .upsert(skillPayload, { onConflict: "slug", ignoreDuplicates: false });
  if (skillErr) {
    console.error("❌ Skills error:", skillErr);
    process.exit(1);
  }
  console.log(`✓ ${SKILLS.length} skills saved`);

  // 4. Verify total
  const { count } = await sb
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("vertical", "tech");
  console.log(`\n✓ Total categories tech en base : ${count}`);
  console.log(`✓ Pages SEO programmatiques estimees : ${count} × 60 villes = ${(count || 0) * 60}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
