/**
 * BTP Phase 0 — Gap analysis "guides des prix".
 *
 * Lit le CSV concurrent (travaux.com, data/competitive/), collapse en sujets
 * "guide des prix" uniques, mappe chaque sujet -> un de NOS métiers (ou flat),
 * croise avec l'existant (24 articles blog "prix" + 48 métiers), priorise
 * P1/P2/P3, et écrit data/competitive/backlog-guides-prix.csv + un récap.
 *
 * AUCUNE page créée. Read-only côté site (lit juste blog_posts + categories).
 *
 * Usage : npx tsx scripts/btp-build-backlog.ts
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const CSV = path.resolve(process.cwd(), "data/competitive/travaux-com-mots-cles-9698.csv");

// ─── parsing CSV robuste (champs quotés avec virgules internes) ──────────
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}
function parseVol(s: string): number {
  s = (s || "").trim().replace(/\s/g, "").replace(/ /g, "").replace(",", ".");
  let mult = 1;
  if (s.endsWith("K")) { mult = 1000; s = s.slice(0, -1); }
  else if (s.endsWith("M")) { mult = 1_000_000; s = s.slice(0, -1); }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.round(n * mult);
}
function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// ─── mapping univers travaux -> NOS métiers (défaut) ─────────────────────
const UNIVERS_METIER: Record<string, string | null> = {
  plomberie: "plombier",
  electricite: "electricien",
  "couverture-toiture": "couvreur",
  chauffage: "chauffagiste",
  climatisation: "climaticien",
  "sols-carrelage": "carreleur",
  peinture: "peintre",
  platre: "plaquiste",
  "fenetre-porte": "menuisier",
  cuisine: "cuisiniste",
  "salles-de-bain-sanitaires": "plombier",
  "construction-renovation-maison": "macon",
  "jardin-et-exterieur": "paysagiste",
  "demolition-evacuation": "terrassier",
  nettoyage: "nettoyage-pro",
  securite: "videosurveillance-installateur",
  bricolage: "petit-bricolage",
  ebenisterie: "menuisier",
  isolation: "facadier",
  "energie-renouvelable-diagnostic": "chauffagiste",
  demenagement: "demenagement",
  ascenseurs: "ascensoriste",
  "traitement-des-nuisibles": "traitement-nuisibles",
};

// ─── raffinage par mots du slug (override, 1er match gagne) ──────────────
const SLUG_RULES: [RegExp, string | null][] = [
  [/ascenseur|monte-charge|plateforme-elevatrice/, "ascensoriste"],
  [/nuisible|deratisation|desinsectisation|punaise|termite|guepe|frelon|cafard|depigeonnage|parasitaire/, "traitement-nuisibles"],
  [/diagnostic|dpe|audit-energetique/, "diagnostic-immobilier"],
  [/electromenager|electro-menager/, "depannage-electromenager"],
  [/store-banne|store-exterieur/, "menuisier"],
  [/carrelage|faience|mosaique/, "carreleur"],
  [/papier-peint|peinture|peindre/, "peintre"],
  [/placo|plaque-de-platre|cloison|plaquiste|faux-plafond|staff/, "plaquiste"],
  [/serrur|porte-blindee|porte-interieure|verrou|cylindre|coffre-fort/, "serrurier"],
  [/vitre|miroir|miroiterie|double-vitrage|survitrage/, "vitrier"],
  [/elagage|abattage|taille-de-haie|taille-arbre|debroussaillage/, "elagueur"],
  [/piscine|bassin/, "pisciniste"],
  [/ramonage/, "ramoneur"],
  [/demoussage|nettoyage-de-toiture|nettoyage-dune-toiture|nettoyage-toiture/, "couvreur"],
  [/facade|ravalement|bardage|isolation-exterieure|crepi/, "facadier"],
  [/plan-de-travail|cuisine-amenagee|cuisine-equipee|cuisiniste/, "cuisiniste"],
  [/alarme|videosurveillance|camera|interphone|portail|domotique|automatisme|visiophone/, "videosurveillance-installateur"],
  [/femme-de-menage|menage/, "menage"],
  [/nettoyage-vitre|laveur-de-vitre/, "nettoyage-vitres"],
  [/nettoyage/, "nettoyage-pro"],
  [/demenagement/, "demenagement"],
  [/debarras|enlevement-dechet|encombrant|vide-maison|vide-grenier/, "debarras"],
  [/climatis|pompe-a-chaleur-air-air|\bclim\b/, "climaticien"],
  [/chaudiere|radiateur|poele|pompe-a-chaleur|granule|plancher-chauffant|chauffe-eau-solaire/, "chauffagiste"],
  [/terrass|fondation|fosse-septique|assainissement|deblai|nivellement|drainage|dalle/, "terrassier"],
  [/robinet|canalisation|chauffe-eau|sanitaire|debouchage|fuite|tuyau|wc|toilette|lavabo|douche|baignoire/, "plombier"],
  [/tableau-electrique|prise|cablage|borne-de-recharge|interrupteur|electrique|electricien/, "electricien"],
  [/toiture|couverture|tuile|ardoise|zinguerie|gouttiere/, "couvreur"],
  [/charpente|ossature-bois/, "charpentier"],
  [/fenetre|porte-de-garage|porte-dentree|porte-d-entree|volet|veranda|escalier|parquet|placard|dressing|menuiserie/, "menuisier"],
  [/maitre-doeuvre|maitre-d-oeuvre|architecte|plan-de-maison|permis-de-construire/, "architecte"],
  [/entretien-de-jardin|entretien-jardin|jardin|gazon|pelouse|cloture|grillage|terrasse|paysag|allee|portail-jardin/, "paysagiste"],
  [/decorat/, "decorateur-interieur"],
  [/mur|parpaing|beton|chape|enduit|crepi|brique|maconnerie|garage|extension|sous-sol|cave/, "macon"],
];

function mapMetier(univers: string, slug: string): string | null {
  const s = stripAccents(slug.toLowerCase());
  for (const [rx, m] of SLUG_RULES) if (rx.test(s)) return m;
  return UNIVERS_METIER[univers] ?? null;
}

type Subj = {
  univers: string;
  travauxSlug: string;
  metier: string | null;
  vol: number;
  kdMin: number | null;
  nKw: number;
  topKw: string;
  topVol: number;
  longtail: string[];
};

async function main() {
  const raw = fs.readFileSync(CSV, "utf-8").replace(/^﻿/, "");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]);
  const idx = (k: string) => header.indexOf(k);
  const iMot = idx("mot_cle"), iVol = idx("volume"), iKd = idx("kd"), iUrl = idx("url");

  const map = new Map<string, Subj>();
  for (let i = 1; i < lines.length; i++) {
    const f = parseCsvLine(lines[i]);
    const url = f[iUrl] || "";
    if (!url.includes("/guide-des-prix/")) continue;
    const slug = url.split("/guide-des-prix/")[1].replace(/\/$/, "");
    const univers = url.split("travaux.com/")[1]?.split("/guide-des-prix/")[0] || "?";
    const key = `${univers}|${slug}`;
    const vol = parseVol(f[iVol]);
    const kd = parseInt(f[iKd], 10);
    let s = map.get(key);
    if (!s) {
      s = { univers, travauxSlug: slug, metier: mapMetier(univers, slug), vol: 0, kdMin: null, nKw: 0, topKw: "", topVol: -1, longtail: [] };
      map.set(key, s);
    }
    s.vol += vol;
    s.nKw++;
    if (!isNaN(kd)) s.kdMin = s.kdMin === null ? kd : Math.min(s.kdMin, kd);
    if (vol > s.topVol) { s.topVol = vol; s.topKw = f[iMot]; }
    if (s.longtail.length < 8) s.longtail.push(f[iMot]);
  }
  const subjects = [...map.values()];

  // ─── croisement existant : 48 métiers + 24 articles blog "prix" ─────────
  const { data: cats } = await sb.from("categories").select("slug").in("vertical", ["btp", "domicile", "personne"]);
  const ourMetiers = new Set((cats || []).map((c) => c.slug));

  const PRICE_RX = /prix|tarif|co[uû]t|combien|€|au m2|au m²/i;
  const blog: string[] = [];
  let off = 0;
  while (true) {
    const { data } = await sb.from("blog_posts").select("slug, title").order("slug").range(off, off + 999);
    const rows = data || [];
    if (rows.length === 0) break;
    for (const b of rows) if (PRICE_RX.test(b.title || "") || PRICE_RX.test(b.slug || "")) blog.push(stripAccents((b.slug || "").toLowerCase()));
    off += rows.length;
    if (rows.length < 1000) break;
  }
  // tokens forts (>=5 chars) des slugs blog -> détection de couverture.
  // On exclut les mots GÉNÉRIQUES (sinon "installation/renovation/maison" font
  // matcher faussement la moitié du backlog) : seul un token PRESTATION compte.
  const STOP = new Set([
    "installation", "renovation", "maison", "energetique", "energie", "vienne",
    "travaux", "complet", "guide", "fourchette", "fourchettes", "devis", "conseil",
    "conseils", "astuce", "astuces", "financiere", "financieres", "aides", "tarif",
    "tarifs", "combien", "couts", "2026", "complets", "detailles", "moyen", "mensuels",
    "forfaits", "obligations", "legales", "remplacement", "reparation", "entretien",
    "intervention", "service", "professionnel", "professionnels", "domicile",
  ]);
  const blogTokens = new Set<string>();
  for (const bs of blog) for (const t of bs.split("-")) if (t.length >= 6 && !STOP.has(t)) blogTokens.add(t);

  function coverage(s: Subj): "migrate" | "new" {
    const toks = stripAccents(s.travauxSlug.toLowerCase()).split("-").filter((t) => t.length >= 6 && !STOP.has(t));
    return toks.some((t) => blogTokens.has(t)) ? "migrate" : "new";
  }
  function priority(s: Subj): "P1" | "P2" | "P3" {
    if (s.kdMin !== null && s.kdMin <= 25 && s.vol >= 500) return "P1";
    if (s.kdMin !== null && s.kdMin <= 40) return "P2";
    return "P3";
  }

  // ─── écriture backlog CSV ───────────────────────────────────────────────
  const rows = subjects.map((s) => ({
    ...s,
    metierValid: s.metier && ourMetiers.has(s.metier) ? s.metier : (s.metier ? `?${s.metier}` : "flat"),
    cov: coverage(s),
    prio: priority(s),
  }));
  rows.sort((a, b) => (a.prio === b.prio ? b.vol - a.vol : a.prio < b.prio ? -1 : 1));

  const outCsv = ["priorite,couverture,metier,univers,volume_cumule,kd_min,nb_mots_cles,top_mot_cle,top_volume,travaux_slug,longtail"]
    .concat(rows.map((r) =>
      [r.prio, r.cov, r.metierValid, r.univers, r.vol, r.kdMin ?? "", r.nKw,
       `"${r.topKw.replace(/"/g, '""')}"`, r.topVol, r.travauxSlug,
       `"${r.longtail.join(" | ").replace(/"/g, '""')}"`].join(",")))
    .join("\n");
  fs.writeFileSync(path.resolve(process.cwd(), "data/competitive/backlog-guides-prix.csv"), outCsv);

  // ─── récap ──────────────────────────────────────────────────────────────
  const byPrio: Record<string, number> = {}, byCov: Record<string, number> = {};
  const byMetier: Record<string, number> = {};
  let flat = 0, unmapped = 0;
  for (const r of rows) {
    byPrio[r.prio] = (byPrio[r.prio] || 0) + 1;
    byCov[r.cov] = (byCov[r.cov] || 0) + 1;
    if (r.metierValid === "flat") flat++;
    else if (r.metierValid.startsWith("?")) unmapped++;
    else byMetier[r.metierValid] = (byMetier[r.metierValid] || 0) + 1;
  }
  console.log(`\n========== BACKLOG GUIDES DES PRIX — ${rows.length} sujets ==========\n`);
  console.log("Par priorité :", JSON.stringify(byPrio));
  console.log("Par couverture :", JSON.stringify(byCov), "(migrate = déjà un article blog à migrer)");
  console.log(`Sans métier dédié (guides 'flat') : ${flat} · slug→métier inconnu (à vérifier) : ${unmapped}`);
  console.log("\nPar métier (top 25) :");
  for (const [m, n] of Object.entries(byMetier).sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`  ${m.padEnd(28)} ${n}`);
  console.log("\nTop 25 sujets P1 (volume) :");
  console.log(`  ${"métier".padEnd(22)} ${"vol".padStart(8)} kd  travaux_slug`);
  for (const r of rows.filter((x) => x.prio === "P1").slice(0, 25))
    console.log(`  ${r.metierValid.padEnd(22)} ${String(r.vol).padStart(8)} ${String(r.kdMin).padStart(2)}  ${r.travauxSlug}`);
  console.log(`\n📝 Écrit data/competitive/backlog-guides-prix.csv (${rows.length} lignes)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
