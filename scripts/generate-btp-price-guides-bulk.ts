/**
 * BTP — Génération EN MASSE des guides des prix depuis le backlog.
 *
 * Lit data/competitive/backlog-guides-prix.csv (486 prestations) + les métiers
 * (catégories) et génère, via Perplexity `sonar`, un guide FACTUEL + SOURCÉ par
 * sujet (title/h1/meta + intro + 5-8 prix + 7 facteurs + 3 devis + 8 FAQ).
 * Prix RÉELS cités, ZÉRO inventé. Upsert price_guides, idempotent (skip-existing).
 *
 * Tracks :
 *   - prestation : 1 guide /guide-des-prix/[slug] par ligne du backlog
 *   - metier     : 1 guide /[metier]/prix par métier BTP
 *
 * Usage :
 *   npx tsx scripts/generate-btp-price-guides-bulk.ts --dry-run --limit=3
 *   npx tsx scripts/generate-btp-price-guides-bulk.ts --track=metier
 *   npx tsx scripts/generate-btp-price-guides-bulk.ts --prio=P1 --limit=50
 *   npx tsx scripts/generate-btp-price-guides-bulk.ts        (tout, P1 puis P2/P3)
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const KEY = process.env.PERPLEXITY_API_KEY;
if (!KEY) { console.error("❌ PERPLEXITY_API_KEY manquante"); process.exit(1); }
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const YEAR = new Date().getFullYear();

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const DRY = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const LIMIT = arg("limit") ? parseInt(arg("limit")!, 10) : Infinity;
const OFFSET = arg("offset") ? parseInt(arg("offset")!, 10) : 0;
const PRIO = arg("prio"); // P1 | P2 | P3
const METIER = arg("metier");
const TRACK = arg("track") || "both"; // prestation | metier | both

// Sujets déjà faits manuellement (fournée 1) — à NE PAS recréer (travaux_slug).
const DONE_TRAVAUX = new Set([
  "prix-dune-dalle-exterieure-en-beton", "prix-de-lentretien-de-jardin", "prix-de-lenlevement-dechets",
  "prix-de-lelagage-arbres", "prix-pose-volets", "prix-de-remplacement-dune-fenetre",
  "prix-de-vidange-dune-fosse-septique", "prix-dun-mur-parpaing", "prix-goudronnage-bitume",
]);
const DONE_METIERS = new Set(["plombier", "serrurier", "paysagiste", "macon"]);

function parseCsvLine(line: string): string[] {
  const out: string[] = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else { if (c === '"') q = true; else if (c === ",") { out.push(cur); cur = ""; } else cur += c; }
  }
  out.push(cur); return out;
}

function cleanSlug(travaux: string): string {
  let s = travaux.toLowerCase()
    .replace(/linstallation/g, "installation").replace(/lentretien/g, "entretien")
    .replace(/lelagage/g, "elagage").replace(/lenlevement/g, "enlevement")
    .replace(/lamenagement/g, "amenagement").replace(/dalarme/g, "alarme")
    .replace(/-d-une-|-d-un-|-dune-|-dun-/g, "-")
    .replace(/-de-la-|-de-l-|-de-l|-de-|-du-|-des-/g, "-")
    .replace(/-la-|-le-|-les-|-au-|-aux-|-en-|-l-/g, "-")
    .replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!/^(prix|type|cout|tarif)-/.test(s)) s = "prix-" + s;
  return s;
}

type Subject = { scope: "metier" | "prestation"; slug: string; metier: string; univers: string; topKw: string; longtail: string; volume: number; kd: number; prio: string };

function buildPrompt(s: Subject, metierName: string): string {
  const subjectDesc = s.scope === "metier"
    ? `l'intervention d'un ${metierName.toLowerCase()} (tarif horaire, déplacement, prestations courantes)`
    : `la prestation correspondant à la recherche Google "${s.topKw}" (métier : ${metierName.toLowerCase()})`;
  return (
    `Tu es un expert des prix des travaux et services à domicile en France. ` +
    `Pour ${subjectDesc}, en ${YEAR}, rédige un guide de prix FACTUEL et SOURCÉ à partir de sources web françaises récentes et fiables. ` +
    `Réponds UNIQUEMENT en JSON valide, sans texte autour :\n` +
    `{\n` +
    `  "title": "<balise title SEO, ~60 caractères, commence par 'Prix', finit par 'en ${YEAR}'>",\n` +
    `  "h1": "<H1 sobre sans l'année, ex: Prix d'une dalle béton extérieure au m²>",\n` +
    `  "meta": "<meta description ~150 caractères, factuelle>",\n` +
    `  "intro": "<3 phrases, ~70 mots, situent la prestation, l'ordre de prix et ce qui le compose>",\n` +
    `  "ranges": [{"label":"<sous-prestation>","low":<entier €>,"high":<entier €>,"unit":"<'/m²','/h','/ml','/arbre','/m³' ou vide>"}],\n` +
    `  "factors": ["<facteur de variation>"],\n` +
    `  "devis": [{"label":"<cas type>","total":"<ex: 1 500 € à 2 000 €>","detail":"<1 phrase>"}],\n` +
    `  "faq": [{"q":"<question>","a":"<réponse ~45 mots avec une fourchette>"}]\n` +
    `}\n` +
    `CONTRAINTES : 5 à 8 "ranges", 5 à 7 "factors", 3 "devis", 7 à 8 "faq" dont une "comment payer moins cher", une sur les aides/crédit d'impôt si pertinent, une sur ce que doit contenir un bon devis. ` +
    `Autres FAQ : couvre ces recherches : ${s.longtail}. ` +
    `Le "title" et le "h1" sont NATIONAUX (France entière) : n'inclure AUCUN nom de ville, de département, de région, NI de marque ou d'entreprise. ` +
    `Prix en euros TTC France ${YEAR}, issus de sources web réelles — n'invente AUCUN chiffre. Ton factuel, zéro superlatif.`
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchGuide(s: Subject, metierName: string): Promise<{ p: any; sources: string[]; cost: number } | null> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "sonar", temperature: 0.1, messages: [{ role: "user", content: buildPrompt(s, metierName) }] }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  const cost = data?.usage?.cost?.total_cost || 0;
  if (!res.ok || !data?.choices) return null;
  const content: string = data.choices[0]?.message?.content || "";
  const citations: string[] = (Array.isArray(data.citations) ? data.citations : null) ||
    (Array.isArray(data.search_results) ? data.search_results.map((x: { url?: string }) => x.url).filter(Boolean) : []) || [];
  const m = content.replace(/\[\d+\]/g, "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const p = JSON.parse(m[0]);
    if (!Array.isArray(p.ranges) || !p.ranges.length || !p.title || !p.h1) return null;
    return { p, sources: citations.slice(0, 4), cost };
  } catch { return null; }
}

async function main() {
  // Charger métiers
  const { data: cats } = await sb.from("categories").select("slug, name").in("vertical", ["btp", "domicile", "personne"]);
  const nameOf = new Map((cats || []).map((c) => [c.slug, c.name]));

  // Construire la liste des sujets
  const subjects: Subject[] = [];
  if (TRACK === "metier" || TRACK === "both") {
    for (const c of cats || []) {
      if (DONE_METIERS.has(c.slug)) continue;
      if (METIER && c.slug !== METIER) continue;
      subjects.push({ scope: "metier", slug: c.slug, metier: c.slug, univers: "", topKw: `prix ${c.name.toLowerCase()}`, longtail: `tarif horaire ${c.name.toLowerCase()}, prix ${c.name.toLowerCase()}, devis ${c.name.toLowerCase()}`, volume: 0, kd: 0, prio: "P1" });
    }
  }
  if (TRACK === "prestation" || TRACK === "both") {
    const csv = fs.readFileSync(path.resolve(process.cwd(), "data/competitive/backlog-guides-prix.csv"), "utf-8");
    const lines = csv.split(/\r?\n/).filter(Boolean);
    const usedSlugs = new Set<string>();
    for (let i = 1; i < lines.length; i++) {
      const f = parseCsvLine(lines[i]);
      const [prio, , metier, univers, vol, kd, , topKw, , travauxSlug, longtail] = f;
      if (metier === "flat" || metier.startsWith("?")) continue;
      if (DONE_TRAVAUX.has(travauxSlug)) continue;
      if (METIER && metier !== METIER) continue;
      const slug = cleanSlug(travauxSlug);
      // Sujet "= le métier" (ex. prix-serrurier, prix-plombier) => couvert par
      // /[metier]/prix, ne PAS recréer un guide prestation (anti-cannibalisation).
      const core = slug.replace(/^prix-/, "");
      if (core === metier || metier.startsWith(core) || core.startsWith(metier)) continue;
      if (usedSlugs.has(slug)) continue; usedSlugs.add(slug);
      subjects.push({ scope: "prestation", slug, metier, univers, topKw: topKw.replace(/^"|"$/g, ""), longtail: longtail.replace(/^"|"$/g, ""), volume: parseInt(vol, 10) || 0, kd: parseInt(kd, 10) || 0, prio });
    }
  }

  // Filtrer priorité + trier (P1 d'abord, volume desc) + offset/limit
  let list = subjects.filter((s) => !PRIO || s.prio === PRIO);
  list.sort((a, b) => (a.prio === b.prio ? b.volume - a.volume : a.prio < b.prio ? -1 : 1));
  list = list.slice(OFFSET, OFFSET + (LIMIT === Infinity ? list.length : LIMIT));

  console.log(`Bulk guides des prix — ${list.length} sujets (track=${TRACK}${PRIO ? ", " + PRIO : ""})${DRY ? " [DRY]" : ""}\n`);
  let ok = 0, skip = 0, fail = 0, total = 0;
  for (const s of list) {
    if (!DRY && !FORCE) {
      const { data: ex } = await sb.from("price_guides").select("id").eq("slug", s.slug).eq("status", "published").maybeSingle();
      if (ex) { skip++; continue; }
    }
    const metierName = nameOf.get(s.metier) || s.metier;
    const r = await fetchGuide(s, metierName);
    await new Promise((res) => setTimeout(res, 1200));
    if (!r) { fail++; console.log(`  ✗ ${s.slug}`); continue; }
    total += r.cost;
    const related: string[] = [];
    const row = {
      slug: s.slug, scope: s.scope, metier_slug: s.metier, univers: s.univers || null,
      title: String(r.p.title).slice(0, 70), h1: String(r.p.h1).slice(0, 90), meta_description: String(r.p.meta || "").slice(0, 165),
      intro_md: String(r.p.intro || "").trim(),
      price_ranges: r.p.ranges, price_sources: r.sources, price_retrieved_at: new Date().toISOString().slice(0, 10),
      factors_md: Array.isArray(r.p.factors) ? "## Ce qui fait varier le prix\n\n" + r.p.factors.map((x: string) => `- ${String(x).trim()}`).join("\n") : null,
      devis_examples: Array.isArray(r.p.devis) ? r.p.devis : [],
      faq: Array.isArray(r.p.faq) ? r.p.faq.map((x: { q: string; a: string }) => ({ q: x.q, a: x.a })) : [],
      related_slugs: related, volume_est: s.volume || null, kd: s.kd || null, status: "published",
    };
    if (DRY) { console.log(`  ▸ ${s.scope === "metier" ? "/" + s.metier + "/prix" : "/guide-des-prix/" + s.slug}\n      title: ${row.title}\n      ${row.price_ranges.length} prix · ${row.faq.length} FAQ`); ok++; continue; }
    const { error } = await sb.from("price_guides").upsert(row, { onConflict: "slug" });
    if (error) { fail++; console.log(`  ✗ ${s.slug}: ${error.message}`); continue; }
    ok++;
    if (ok % 20 === 0) console.log(`  … ${ok} générés (coût ≈ $${total.toFixed(2)})`);
  }
  console.log(`\nOK : ${ok} · skip(existant) : ${skip} · échecs : ${fail} · coût ≈ $${total.toFixed(4)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
