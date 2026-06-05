/**
 * BTP — Génération des guides des prix (prix RÉELS sourcés Perplexity).
 *
 * Pour chaque sujet : 1 appel Perplexity `sonar` renvoie un guide FACTUEL et
 * SOURCÉ (intro, fourchettes, facteurs, devis, FAQ) — TOUT vient du web cité,
 * ZÉRO chiffre inventé. Upsert dans price_guides (status='published').
 *
 * Usage :
 *   npx tsx scripts/generate-btp-price-guides.ts --dry-run   (1 sujet, pas d'insert)
 *   npx tsx scripts/generate-btp-price-guides.ts             (toute la fournée)
 */
import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const KEY = process.env.PERPLEXITY_API_KEY;
const DRY = process.argv.includes("--dry-run");
if (!KEY) { console.error("❌ PERPLEXITY_API_KEY manquante"); process.exit(1); }
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const YEAR = new Date().getFullYear();

type Subject = {
  scope: "metier" | "prestation";
  slug: string;       // slug prestation ; pour metier = slug métier (route /[metier]/prix)
  metier: string;
  univers: string;
  title: string;
  h1: string;
  meta: string;
  what: string;       // description courte de la prestation pour Perplexity
  longtail: string;   // variantes à couvrir en FAQ
  volume: number;
  kd: number;
};

// ─── FOURNÉE 1 : sujets P1 à fort volume, "new" (sans chevauchement blog) ──
const BATCH: Subject[] = [
  { scope: "metier", slug: "plombier", metier: "plombier", univers: "plomberie", title: "Prix d'un plombier en 2026 : tarif horaire, déplacement et devis", h1: "Prix d'un plombier en 2026", meta: "Combien coûte un plombier en 2026 ? Tarif horaire, prix au déplacement, fourchettes par intervention et devis gratuits d'artisans près de chez vous.", what: "l'intervention d'un plombier (tarif horaire, déplacement, dépannage, installation)", longtail: "tarif horaire plombier, prix plombier déplacement, prix intervention plombier, tarif plombier dimanche", volume: 86150, kd: 7 },
  { scope: "metier", slug: "serrurier", metier: "serrurier", univers: "fenetre-porte", title: "Prix d'un serrurier en 2026 : ouverture de porte, urgence et devis", h1: "Prix d'un serrurier en 2026", meta: "Prix d'un serrurier en 2026 : ouverture de porte, changement de serrure, urgence de nuit. Fourchettes réelles et devis gratuits.", what: "l'intervention d'un serrurier (ouverture de porte, changement de serrure, urgence)", longtail: "prix ouverture de porte serrurier, tarif serrurier urgence nuit, prix changement serrure, prix serrurier dimanche", volume: 110510, kd: 6 },
  { scope: "metier", slug: "paysagiste", metier: "paysagiste", univers: "jardin-et-exterieur", title: "Prix d'un paysagiste en 2026 : tarif horaire et création de jardin", h1: "Prix d'un paysagiste en 2026", meta: "Prix d'un paysagiste en 2026 : tarif horaire, création et entretien de jardin, aménagement extérieur. Fourchettes et devis gratuits.", what: "l'intervention d'un paysagiste (tarif horaire, création de jardin, aménagement extérieur)", longtail: "tarif horaire paysagiste, prix création jardin, prix aménagement extérieur, prix paysagiste à la journée", volume: 22200, kd: 44 },
  { scope: "metier", slug: "macon", metier: "macon", univers: "construction-renovation-maison", title: "Prix d'un maçon en 2026 : tarif horaire et prix au m²", h1: "Prix d'un maçon en 2026", meta: "Prix d'un maçon en 2026 : tarif horaire, prix au m² (mur, dalle, fondation), devis gratuits d'artisans près de chez vous.", what: "l'intervention d'un maçon (tarif horaire, mur, dalle, fondation)", longtail: "tarif horaire maçon, prix maçon au m2, prix maçonnerie, prix maçon à la journée", volume: 18100, kd: 30 },

  { scope: "prestation", slug: "prix-dalle-beton-exterieure-m2", metier: "macon", univers: "construction-renovation-maison", title: "Prix d'une dalle béton extérieure au m² en 2026", h1: "Prix d'une dalle béton extérieure au m²", meta: "Prix d'une dalle béton extérieure au m² en 2026 : fourniture, ferraillage, coulage. Fourchettes réelles selon l'épaisseur et la surface + devis gratuits.", what: "la réalisation d'une dalle béton extérieure (terrasse, allée, abri) au m²", longtail: "prix dalle béton 20m2, prix dalle béton armé m2, prix dalle béton terrasse, dalle béton 30m2 prix", volume: 120410, kd: 10 },
  { scope: "prestation", slug: "prix-entretien-jardin", metier: "paysagiste", univers: "jardin-et-exterieur", title: "Prix de l'entretien d'un jardin en 2026 (heure, contrat annuel)", h1: "Prix de l'entretien d'un jardin", meta: "Prix de l'entretien d'un jardin en 2026 : tarif horaire, contrat annuel, tonte, taille. Fourchettes réelles et crédit d'impôt + devis gratuits.", what: "l'entretien d'un jardin (tonte, taille, désherbage, contrat annuel)", longtail: "prix entretien jardin à l'année, tarif horaire jardinier, prix contrat entretien jardin, prix tonte pelouse", volume: 91350, kd: 4 },
  { scope: "prestation", slug: "prix-enlevement-encombrants", metier: "debarras", univers: "demolition-evacuation", title: "Prix d'un enlèvement d'encombrants et de déchets en 2026", h1: "Prix d'un enlèvement d'encombrants", meta: "Prix d'un enlèvement d'encombrants et de déchets en 2026 : au m³, au volume, débarras de maison. Fourchettes réelles et devis gratuits.", what: "l'enlèvement d'encombrants et de déchets (au m³, débarras)", longtail: "prix enlèvement encombrants m3, prix débarras maison, tarif enlèvement déchets, prix évacuation gravats", volume: 91230, kd: 10 },
  { scope: "prestation", slug: "prix-elagage-arbre", metier: "elagueur", univers: "jardin-et-exterieur", title: "Prix de l'élagage d'un arbre en 2026", h1: "Prix de l'élagage d'un arbre", meta: "Prix de l'élagage d'un arbre en 2026 : selon la hauteur, à l'heure, à la journée. Fourchettes réelles et crédit d'impôt + devis gratuits.", what: "l'élagage et la taille d'un arbre (selon hauteur, à l'heure)", longtail: "prix élagage arbre haut, tarif élagueur à l'heure, prix abattage arbre, prix taille arbre", volume: 76400, kd: 9 },
  { scope: "prestation", slug: "prix-pose-volets", metier: "menuisier", univers: "fenetre-porte", title: "Prix de la pose de volets en 2026 (roulants, battants)", h1: "Prix de la pose de volets", meta: "Prix de la pose de volets en 2026 : roulants, battants, électriques. Fourniture + pose, fourchettes réelles par type + devis gratuits.", what: "la fourniture et pose de volets (roulants, battants, électriques)", longtail: "prix pose volet roulant, prix volet battant posé, prix volet roulant électrique, tarif pose volets", volume: 56850, kd: 9 },
  { scope: "prestation", slug: "prix-remplacement-fenetre", metier: "menuisier", univers: "fenetre-porte", title: "Prix du remplacement d'une fenêtre en 2026 (PVC, alu, bois)", h1: "Prix du remplacement d'une fenêtre", meta: "Prix du remplacement d'une fenêtre en 2026 : PVC, alu, bois, double vitrage. Fourniture + pose, aides + devis gratuits d'artisans.", what: "le remplacement d'une fenêtre (PVC, alu, bois, double vitrage)", longtail: "prix fenêtre PVC posée, prix changement fenêtre double vitrage, prix fenêtre alu, prix remplacement fenêtre", volume: 51670, kd: 12 },
  { scope: "prestation", slug: "prix-vidange-fosse-septique", metier: "plombier", univers: "plomberie", title: "Prix d'une vidange de fosse septique en 2026", h1: "Prix d'une vidange de fosse septique", meta: "Prix d'une vidange de fosse septique en 2026 : selon le volume, déplacement inclus. Fourchettes réelles et fréquence conseillée + devis gratuits.", what: "la vidange d'une fosse septique (selon volume, camion hydrocureur)", longtail: "prix vidange fosse septique 3000l, tarif vidange fosse toutes eaux, prix vidange fosse, fréquence vidange fosse septique", volume: 48090, kd: 11 },
  { scope: "prestation", slug: "prix-mur-parpaing-m2", metier: "macon", univers: "construction-renovation-maison", title: "Prix d'un mur en parpaing au m² en 2026", h1: "Prix d'un mur en parpaing au m²", meta: "Prix d'un mur en parpaing au m² en 2026 : fourniture + pose, selon l'épaisseur et la hauteur. Fourchettes réelles + devis gratuits de maçons.", what: "la construction d'un mur en parpaing (au m², fourniture + pose)", longtail: "prix mur parpaing m2 posé, prix mur clôture parpaing, prix m2 parpaing main d'oeuvre, prix mur parpaing 20", volume: 40810, kd: 9 },
  { scope: "prestation", slug: "prix-goudronnage-enrobe-m2", metier: "terrassier", univers: "jardin-et-exterieur", title: "Prix du goudronnage / enrobé au m² en 2026", h1: "Prix du goudronnage et de l'enrobé au m²", meta: "Prix du goudronnage et de l'enrobé au m² en 2026 : cour, allée, parking. Selon la surface et le type d'enrobé + devis gratuits.", what: "le goudronnage / enrobé d'une cour ou allée (au m²)", longtail: "prix enrobé m2, prix goudronnage cour, prix enrobé à chaud m2, prix bitume allée", volume: 44480, kd: 7 },
];

function buildPrompt(s: Subject): string {
  return (
    `Tu es un expert des prix des travaux et services à domicile en France. ` +
    `Pour ${s.what}, en ${YEAR}, rédige un guide de prix FACTUEL et SOURCÉ à partir de sources web françaises récentes et fiables. ` +
    `Réponds UNIQUEMENT en JSON valide, sans texte autour :\n` +
    `{\n` +
    `  "intro": "<3 phrases factuelles d'introduction, ~70 mots, qui situent la prestation, l'ordre de prix et ce qui le compose>",\n` +
    `  "ranges": [{"label":"<sous-prestation précise>","low":<entier euros>,"high":<entier euros>,"unit":"<un parmi: /m², /h, /ml, /arbre, /m³ ou vide pour un forfait>"}],\n` +
    `  "factors": ["<facteur concret qui fait varier le prix>"],\n` +
    `  "devis": [{"label":"<cas type réaliste>","total":"<ex: 1 500 € à 2 000 €>","detail":"<1 phrase de contexte>"}],\n` +
    `  "faq": [{"q":"<question fréquente>","a":"<réponse factuelle ~45 mots avec une fourchette de prix>"}]\n` +
    `}\n` +
    `CONTRAINTES : 5 à 8 lignes dans "ranges" (couvre les variantes de matériau/taille/gamme), 5 à 7 "factors", 3 "devis" chiffrés, 7 à 8 "faq". ` +
    `Parmi les FAQ, inclure obligatoirement : une question "comment payer moins cher / économiser sur ${s.what}", ` +
    `une question sur les aides, subventions ou crédit d'impôt éventuels (si pertinent), et une sur ce que doit contenir un bon devis. ` +
    `Les autres FAQ couvrent ces recherches réelles : ${s.longtail}. ` +
    `Tous les prix sont en euros TTC, France ${YEAR}, et proviennent de sources web réelles — n'invente AUCUN chiffre. Pas de superlatif marketing, ton factuel et utile.`
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchGuide(s: Subject): Promise<{ payload: any; sources: string[]; cost: number } | null> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "sonar", temperature: 0.1, messages: [{ role: "user", content: buildPrompt(s) }] }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  const cost = data?.usage?.cost?.total_cost || 0;
  if (!res.ok || !data?.choices) { console.log(`  ✗ ${s.slug}: API ${res.status}`); return null; }
  const content: string = data.choices[0]?.message?.content || "";
  const citations: string[] =
    (Array.isArray(data.citations) ? data.citations : null) ||
    (Array.isArray(data.search_results) ? data.search_results.map((x: { url?: string }) => x.url).filter(Boolean) : []) || [];
  const m = content.replace(/\[\d+\]/g, "").match(/\{[\s\S]*\}/);
  if (!m) { console.log(`  ✗ ${s.slug}: pas de JSON`); return null; }
  try {
    const payload = JSON.parse(m[0]);
    if (!Array.isArray(payload.ranges) || payload.ranges.length === 0) { console.log(`  ✗ ${s.slug}: ranges vides`); return null; }
    return { payload, sources: citations.slice(0, 4), cost };
  } catch { console.log(`  ✗ ${s.slug}: parse KO`); return null; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFactorsMd(factors: any[]): string {
  return "## Ce qui fait varier le prix\n\n" + factors.map((f) => `- ${String(f).trim()}`).join("\n");
}

async function main() {
  const FORCE = process.argv.includes("--force");
  const list = DRY ? BATCH.slice(0, 1) : BATCH;
  console.log(`Génération guides des prix — ${list.length} sujets${DRY ? " (DRY)" : ""}\n`);
  let total = 0, ok = 0;
  for (const s of list) {
    // Skip si déjà publié (re-run = retry des seuls échecs), sauf --force.
    if (!DRY && !FORCE) {
      const { data: existing } = await sb.from("price_guides").select("id").eq("slug", s.slug).eq("status", "published").maybeSingle();
      if (existing) { console.log(`  = ${s.slug} déjà publié (skip)`); ok++; continue; }
    }
    const r = await fetchGuide(s);
    await new Promise((res) => setTimeout(res, 1200));
    if (!r) continue;
    total += r.cost;
    const related = BATCH.filter((x) => x.metier === s.metier && x.slug !== s.slug && x.scope === "prestation").map((x) => x.slug).slice(0, 5);
    const row = {
      slug: s.slug, scope: s.scope, metier_slug: s.metier, univers: s.univers,
      title: s.title, h1: s.h1, meta_description: s.meta,
      intro_md: String(r.payload.intro || "").trim(),
      price_ranges: r.payload.ranges,
      price_sources: r.sources,
      price_retrieved_at: new Date().toISOString().slice(0, 10),
      factors_md: Array.isArray(r.payload.factors) ? toFactorsMd(r.payload.factors) : null,
      devis_examples: Array.isArray(r.payload.devis) ? r.payload.devis : [],
      faq: Array.isArray(r.payload.faq) ? r.payload.faq.map((f: { q: string; a: string }) => ({ q: f.q, a: f.a })) : [],
      related_slugs: related,
      volume_est: s.volume || null, kd: s.kd || null,
      status: "published",
    };
    if (DRY) { console.log(`\n=== ${s.slug} ===\n`, JSON.stringify(row, null, 2).slice(0, 2200)); ok++; continue; }
    const { error } = await sb.from("price_guides").upsert(row, { onConflict: "slug" });
    if (error) { console.log(`  ✗ ${s.slug}: insert ${error.message}`); continue; }
    console.log(`  ✓ ${s.slug.padEnd(34)} ${r.payload.ranges.length} prix · ${(r.payload.faq || []).length} FAQ · ${r.sources.length} src`);
    ok++;
  }
  console.log(`\nOK : ${ok}/${list.length} · coût ≈ $${total.toFixed(4)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
