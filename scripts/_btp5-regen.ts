/**
 * BTP-5 : régénère les guides de prix "dérivés" (H1/contenu ≠ slug) pour qu'ils
 * collent à leur slug → résout la cannibalisation. Réutilise la génération
 * sourcée Perplexity de generate-btp-price-guides.ts. Throwaway (_).
 *
 *   npx tsx scripts/_btp5-regen.ts --list   # liste les dérivés + sujet dérivé (review)
 *   npx tsx scripts/_btp5-regen.ts --dry     # 1 vraie génération Perplexity (preview)
 *   npx tsx scripts/_btp5-regen.ts --apply   # régénère + UPDATE tous les dérivés
 */
import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const KEY = process.env.PERPLEXITY_API_KEY;
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const YEAR = new Date().getFullYear();
const MODE = process.argv.includes("--apply") ? "apply" : process.argv.includes("--dry") ? "dry" : "list";

type Guide = { slug: string; scope: string; metier_slug: string | null; univers: string | null; h1: string; title: string; volume_est: number | null; kd: number | null };

async function loadAll<T>(table: string, cols: string, f?: (q: any) => any): Promise<T[]> {
  const PAGE = 1000; let off = 0; const all: T[] = [];
  while (true) {
    let q: any = sb.from(table).select(cols).range(off, off + PAGE - 1);
    if (f) q = f(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    const rows = (data || []) as T[];
    if (rows.length === 0) break;
    all.push(...rows); off += rows.length;
  }
  return all;
}

const STOP = new Set(["prix", "cout", "type", "de", "d", "du", "des", "la", "le", "les", "un", "une", "au", "aux", "en", "par", "et", "pour", "a", "m2", "l", "sur"]);
const deburr = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const slugTokens = (slug: string) => deburr(slug).split("-").filter((w) => w.length >= 3 && !STOP.has(w));
const h1Norm = (h1: string) => deburr(h1).replace(/[^a-z0-9\s]/g, " ");

// Un guide prestation est "dérivé" si <50% des tokens significatifs du slug
// apparaissent dans le H1 (le contenu a glissé vers un autre sujet).
function isDrifted(g: Guide): boolean {
  if (g.scope !== "prestation") return false;
  const toks = slugTokens(g.slug);
  if (toks.length === 0) return false;
  const h = " " + h1Norm(g.h1) + " ";
  const hit = toks.filter((t) => h.includes(t)).length;
  return hit / toks.length < 0.5;
}

// Sujet "humain" dérivé du slug. Overrides pour les slugs ambigus/awkward.
const OVERRIDES: Record<string, { topic: string; h1: string }> = {
  "prix-porte-interieure-sur-mesure": { topic: "la fourniture et pose d'une porte intérieure sur mesure", h1: "Prix d'une porte intérieure sur mesure" },
  "prix-installation-reparation-domotique": { topic: "l'installation d'un système domotique (maison connectée)", h1: "Prix d'une installation domotique" },
  "prix-installation-appareil-electromenager": { topic: "l'installation et le raccordement d'un appareil électroménager", h1: "Prix d'installation d'un appareil électroménager" },
  "prix-construction-maison-parpaing": { topic: "la construction d'une maison en parpaing (gros œuvre)", h1: "Prix de construction d'une maison en parpaing" },
  "prix-construction-cuisine-dexterieur": { topic: "la construction d'une cuisine d'extérieur (cuisine d'été)", h1: "Prix d'une cuisine d'extérieur" },
  "prix-pose-terrasse-bois": { topic: "la pose d'une terrasse en bois (tous bois)", h1: "Prix de pose d'une terrasse en bois" },
  "prix-installation-fenetre": { topic: "la pose d'une fenêtre (neuf ou rénovation)", h1: "Prix de pose d'une fenêtre" },
  "prix-pose-gouttiere": { topic: "la pose de gouttières (zinc, PVC, aluminium)", h1: "Prix de pose de gouttières" },
  "prix-escalier-kit-beton": { topic: "un escalier en béton préfabriqué en kit", h1: "Prix d'un escalier en béton en kit" },
  "prix-escalier-aluminium": { topic: "un escalier en aluminium", h1: "Prix d'un escalier en aluminium" },
  "prix-escalier-pas-cher": { topic: "un escalier d'intérieur petit budget (pas cher)", h1: "Prix d'un escalier pas cher" },
  "prix-reparation-vmc": { topic: "la réparation d'une VMC (ventilation mécanique contrôlée)", h1: "Prix de réparation d'une VMC" },
  "prix-remplacement-vmc": { topic: "le remplacement d'une VMC (ventilation mécanique contrôlée)", h1: "Prix de remplacement d'une VMC" },
  "prix-installation-pompe-puisard": { topic: "l'installation d'une pompe de puisard (vide-cave)", h1: "Prix d'une pompe de puisard" },
  "prix-remplacement-porte-garage": { topic: "le remplacement d'une porte de garage", h1: "Prix de remplacement d'une porte de garage" },
  "prix-pose-porte-garage": { topic: "la pose d'une porte de garage (neuve)", h1: "Prix de pose d'une porte de garage" },
  "prix-renovation-plafonds": { topic: "la rénovation de plafonds (réfection, enduit, peinture)", h1: "Prix de rénovation d'un plafond" },
  "prix-remplacement-ascenseur": { topic: "le remplacement ou la modernisation d'un ascenseur", h1: "Prix de remplacement d'un ascenseur" },
  "prix-jardin": { topic: "l'aménagement complet d'un jardin (création paysagère)", h1: "Prix d'aménagement d'un jardin" },
  "prix-bricolage-a-domicile": { topic: "une prestation de petits travaux de bricolage à domicile", h1: "Prix du bricolage à domicile" },
  "prix-professionnel-menage": { topic: "le ménage à domicile par une société de ménage professionnelle", h1: "Prix d'une société de ménage" },
  "prix-demenagement-france": { topic: "un déménagement longue distance en France", h1: "Prix d'un déménagement en France" },
  "prix-travaux-platrerie": { topic: "des travaux de plâtrerie (cloisons, enduits, plafonds)", h1: "Prix de travaux de plâtrerie" },
  "prix-facade-legislation-obligations-legales": { topic: "un ravalement de façade et ses obligations légales (autorisation, ravalement obligatoire)", h1: "Ravalement de façade : prix et obligations légales" },
  "type-ascenseur-choisir": { topic: "le choix et le prix des différents types d'ascenseurs de maison", h1: "Quel ascenseur choisir : types et prix" },
};

function deriveSubject(g: Guide) {
  const ov = OVERRIDES[g.slug];
  if (ov) return { topic: ov.topic, h1: ov.h1 };
  const words = slugTokens(g.slug).join(" ");
  return { topic: `la prestation « ${words} »`, h1: `Prix : ${words}` };
}

function buildPrompt(what: string, longtail: string): string {
  return (
    `Tu es un expert des prix des travaux et services à domicile en France. ` +
    `Pour ${what}, en ${YEAR}, rédige un guide de prix FACTUEL et SOURCÉ à partir de sources web françaises récentes et fiables. ` +
    `Réponds UNIQUEMENT en JSON valide, sans texte autour :\n{\n` +
    `  "intro": "<3 phrases factuelles, ~70 mots, qui situent la prestation, l'ordre de prix et ce qui le compose>",\n` +
    `  "ranges": [{"label":"<sous-prestation précise>","low":<entier euros>,"high":<entier euros>,"unit":"<un parmi: /m², /h, /ml, /arbre, /m³ ou vide pour un forfait>"}],\n` +
    `  "factors": ["<facteur concret qui fait varier le prix>"],\n` +
    `  "devis": [{"label":"<cas type réaliste>","total":"<ex: 1 500 € à 2 000 €>","detail":"<1 phrase de contexte>"}],\n` +
    `  "faq": [{"q":"<question fréquente>","a":"<réponse factuelle ~45 mots avec une fourchette de prix>"}]\n}\n` +
    `CONTRAINTES : 5 à 8 "ranges", 5 à 7 "factors", 3 "devis" chiffrés, 7 à 8 "faq". ` +
    `Parmi les FAQ : une "comment payer moins cher", une sur les aides/crédit d'impôt si pertinent, une sur ce que doit contenir un bon devis. ` +
    `Les autres FAQ couvrent : ${longtail}. ` +
    `Prix en euros TTC, France ${YEAR}, issus de sources web réelles, n'invente AUCUN chiffre. Ton factuel, pas de superlatif marketing.`
  );
}

async function fetchGuide(what: string, longtail: string) {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "sonar", temperature: 0.1, messages: [{ role: "user", content: buildPrompt(what, longtail) }] }),
  });
  const data: any = await res.json();
  const cost = data?.usage?.cost?.total_cost || 0;
  if (!res.ok || !data?.choices) return { payload: null, sources: [], cost };
  const content: string = data.choices[0]?.message?.content || "";
  const citations: string[] = (Array.isArray(data.citations) ? data.citations : null) || (Array.isArray(data.search_results) ? data.search_results.map((x: any) => x.url).filter(Boolean) : []) || [];
  const m = content.replace(/\[\d+\]/g, "").match(/\{[\s\S]*\}/);
  if (!m) return { payload: null, sources: [], cost };
  try {
    const payload = JSON.parse(m[0]);
    if (!Array.isArray(payload.ranges) || payload.ranges.length === 0) return { payload: null, sources: [], cost };
    return { payload, sources: citations.slice(0, 4), cost };
  } catch { return { payload: null, sources: [], cost }; }
}
const toFactorsMd = (factors: any[]) => "## Ce qui fait varier le prix\n\n" + factors.map((f) => `- ${String(f).trim()}`).join("\n");

async function main() {
  const guides = await loadAll<Guide>("price_guides", "slug, scope, metier_slug, univers, h1, title, volume_est, kd", (q) => q.eq("status", "published"));
  const drifted = guides.filter(isDrifted);
  console.log(`${drifted.length} guides dérivés détectés (mode=${MODE})\n`);

  if (MODE === "list") {
    for (const g of drifted) {
      const d = deriveSubject(g);
      const hasOv = OVERRIDES[g.slug] ? "✓override" : "⚠️auto";
      console.log(`  ${hasOv}  ${g.slug}`);
      console.log(`      H1 actuel : « ${g.h1} »`);
      console.log(`      → nouveau : « ${d.h1} »  [${d.topic}]`);
    }
    const missing = drifted.filter((g) => !OVERRIDES[g.slug]);
    if (missing.length) console.log(`\n⚠️ ${missing.length} dérivés SANS override (sujet auto, à vérifier) : ${missing.map((g) => g.slug).join(", ")}`);
    return;
  }

  // On NE régénère QUE les guides explicitement ciblés par un OVERRIDE (= les
  // membres des 21 clusters de cannibalisation réels). Les autres "dérivés" du
  // détecteur sont des synonymes valides → ne pas y toucher (risque de dégrader
  // + dérivations auto charabia).
  const toRegen = guides.filter((g) => OVERRIDES[g.slug]);
  const list = MODE === "dry" ? toRegen.slice(0, 1) : toRegen;
  console.log(`→ ${toRegen.length} guides ciblés (overrides cannibalisation) à régénérer.\n`);
  if (!KEY) { console.error("❌ PERPLEXITY_API_KEY manquante"); process.exit(1); }
  let okN = 0, cost = 0;
  for (const g of list) {
    const d = deriveSubject(g);
    const longtail = slugTokens(g.slug).join(", ");
    const r = await fetchGuide(d.topic, longtail);
    await new Promise((res) => setTimeout(res, 1200));
    cost += r.cost;
    if (!r.payload) { console.log(`  ✗ ${g.slug} : génération KO`); continue; }
    const newTitle = `${d.h1} en ${YEAR}`;
    const row: any = {
      slug: g.slug, scope: "prestation", metier_slug: g.metier_slug, univers: g.univers,
      title: newTitle, h1: d.h1,
      meta_description: `${d.h1} en ${YEAR} : fourchettes de prix réelles, facteurs, exemples de devis et FAQ. Devis gratuits d'artisans près de chez vous.`,
      intro_md: String(r.payload.intro || "").trim(),
      price_ranges: r.payload.ranges, price_sources: r.sources,
      price_retrieved_at: new Date().toISOString().slice(0, 10),
      factors_md: Array.isArray(r.payload.factors) ? toFactorsMd(r.payload.factors) : null,
      devis_examples: Array.isArray(r.payload.devis) ? r.payload.devis : [],
      faq: Array.isArray(r.payload.faq) ? r.payload.faq.map((f: any) => ({ q: f.q, a: f.a })) : [],
      volume_est: g.volume_est, kd: g.kd, status: "published",
    };
    if (MODE === "dry") { console.log(`\n=== ${g.slug} → « ${d.h1} » ===\n`, JSON.stringify({ h1: row.h1, title: row.title, intro_md: row.intro_md, ranges: row.price_ranges, faqN: row.faq.length, sources: row.price_sources }, null, 2).slice(0, 2400)); okN++; continue; }
    const { error } = await sb.from("price_guides").update(row).eq("slug", g.slug);
    if (error) { console.log(`  ✗ ${g.slug} : update ${error.message}`); continue; }
    console.log(`  ✓ ${g.slug.padEnd(40)} → « ${d.h1} »  (${r.payload.ranges.length} prix · ${(r.payload.faq || []).length} FAQ)`);
    okN++;
  }
  console.log(`\nOK : ${okN}/${list.length} · coût ≈ $${cost.toFixed(4)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
