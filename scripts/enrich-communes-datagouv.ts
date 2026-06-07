/**
 * Enrichit `commune_data` avec de la VRAIE donnée ouverte data.gouv.fr,
 * par commune (clé insee_code). Sources validées par sous-agents (07/06),
 * toutes Licence Ouverte, ZÉRO chiffre inventé.
 *
 * Sources gérées ici (CSV Tabular, taille raisonnable) :
 *   dvf         prix immobilier (DVF 2024)
 *   revenus     médiane revenu disponible (FiLoSoFi 2021)
 *   logements   vacance parc privé (LOVAC 2024)
 *   equipements niveau d'équipements + densité (Communes France 2025)
 * (construction SITADEL 88 Mo = ETL streaming séparé, pas ici.)
 *
 * Upsert merge : chaque source ne pose QUE ses colonnes → elles s'accumulent
 * dans la même ligne commune_data (PostgREST merge-duplicates).
 *
 * Prérequis : migration migrations/2026-06-07_commune_data.sql appliquée.
 * Usage :
 *   npx tsx scripts/enrich-communes-datagouv.ts --source=revenus --dry-run
 *   npx tsx scripts/enrich-communes-datagouv.ts --source=all
 */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry-run");
const SRC = (process.argv.find((a) => a.startsWith("--source=")) || "--source=all").split("=")[1];
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// ── Parsing CSV robuste (quote-aware) + détection délimiteur ──
function detectDelim(header: string): string {
  return (header.match(/;/g)?.length || 0) > (header.match(/,/g)?.length || 0) ? ";" : ",";
}
function splitCsv(line: string, d: string): string[] {
  const out: string[] = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === d && !q) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}
// 's' (secret stat), '', 'N/A' → null ; sinon entier arrondi
function toInt(v: string | undefined): number | null {
  if (v == null) return null;
  const t = v.trim();
  if (t === "" || t === "s" || t === "N/A" || t === "ND" || t === "nd") return null;
  const n = Math.round(Number(t.replace(",", ".").replace(/\s/g, "")));
  return Number.isFinite(n) ? n : null;
}
function toNum(v: string | undefined): number | null {
  if (v == null) return null;
  const t = v.trim();
  if (t === "" || t === "s") return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

async function fetchRows(url: string): Promise<{ header: string[]; delim: string; lines: string[] }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const text = await res.text();
  const lines = text.split("\n").filter((l) => l.trim().length);
  const delim = detectDelim(lines[0]);
  const header = splitCsv(lines[0], delim).map((h) => h.trim());
  return { header, delim, lines: lines.slice(1) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsert(rows: any[], label: string) {
  if (DRY) {
    console.log(`  [dry] ${label}: ${rows.length} lignes. Échantillon:`, JSON.stringify(rows[0]));
    return;
  }
  let done = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from("commune_data").upsert(rows.slice(i, i + 500), { onConflict: "insee_code" });
    if (error) throw new Error(`${label} batch ${i}: ${error.message}`);
    done += Math.min(500, rows.length - i);
  }
  console.log(`  ✓ ${label}: ${done} communes`);
}

// ── Source DVF (prix immobilier) ──
async function dvf() {
  const { header, delim, lines } = await fetchRows("https://static.data.gouv.fr/resources/indicateurs-immobiliers-par-commune-et-par-annee-prix-et-volumes-sur-la-periode-2014-2024/20250707-085855/communesdvf2024.csv");
  const ix = (n: string) => header.indexOf(n);
  const I = ix("INSEE_COM"), P2 = ix("Prixm2Moyen"), P = ix("PrixMoyen"), M = ix("nb_mutations"), S = ix("SurfaceMoy"), PM = ix("PropMaison"), A = ix("annee");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = [];
  for (const l of lines) {
    const c = splitCsv(l, delim); const insee = (c[I] || "").trim(); const p2 = toInt(c[P2]);
    if (!insee || p2 == null) continue;
    rows.push({ insee_code: insee, prix_m2_moyen: p2, prix_moyen_bien: toInt(c[P]), nb_mutations: toInt(c[M]), surface_moy: toInt(c[S]), prop_maison: toInt(c[PM]), dvf_annee: toInt(c[A]) });
  }
  await upsert(rows, "DVF prix immobilier");
}

// ── Source Revenus (FiLoSoFi médiane) ──
async function revenus() {
  const { header, delim, lines } = await fetchRows("https://static.data.gouv.fr/resources/revenu-des-francais-a-la-commune/20251210-134014/revenu-des-francais-a-la-commune-1765372688826.csv");
  const ix = (n: string) => header.findIndex((h) => h === n);
  const I = ix("Code géographique"), MED = ix("[DISP] Médiane (€)"), Q1 = ix("[DISP] 1ᵉʳ quartile (€)"), Q3 = ix("[DISP] 3ᵉ quartile (€)"), IMP = ix("[DEC] Part des ménages fiscaux imposés (%)");
  if (I < 0 || MED < 0) throw new Error(`revenus: colonnes introuvables (I=${I} MED=${MED}). Header: ${header.slice(0, 12).join(" | ")}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = [];
  for (const l of lines) {
    const c = splitCsv(l, delim); const insee = (c[I] || "").trim(); const med = toInt(c[MED]);
    if (!insee || med == null) continue;
    rows.push({ insee_code: insee, revenu_median: med, revenu_q1: toInt(c[Q1]), revenu_q3: toInt(c[Q3]), part_menages_imposes: toNum(c[IMP]), filosofi_annee: 2021 });
  }
  await upsert(rows, "Revenus FiLoSoFi");
}

// ── Source Logements vacants (LOVAC) ──
async function logements() {
  const { header, delim, lines } = await fetchRows("https://static.data.gouv.fr/resources/logements-vacants-du-parc-prive-lovac-par-commune-departement-region-et-france/20250528-090420/lovac-opendata-communes.csv");
  const ix = (n: string) => header.indexOf(n);
  const I = ix("CODGEO_25"), T = ix("pp_total_24"), V = ix("pp_vacant_24"), V2 = ix("pp_vacant_plus_2ans_24");
  if (I < 0 || T < 0) throw new Error(`logements: colonnes introuvables. Header: ${header.slice(0, 12).join(" | ")}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = [];
  for (const l of lines) {
    const c = splitCsv(l, delim); const insee = (c[I] || "").trim();
    const total = toInt(c[T]), vac = toInt(c[V]);
    if (!insee || total == null) continue;
    const taux = total > 0 && vac != null ? Math.round((vac / total) * 1000) / 10 : null;
    rows.push({ insee_code: insee, logements_prive_total: total, logements_vacants: vac, logements_vacants_2ans: toInt(c[V2]), taux_vacance: taux, lovac_annee: 2024 });
  }
  await upsert(rows, "Logements vacants LOVAC");
}

// ── Source Équipements + densité (Communes France 2025) ──
async function equipements() {
  const { header, delim, lines } = await fetchRows("https://static.data.gouv.fr/resources/communes-et-villes-de-france-en-csv-excel-json-parquet-et-feather/20250221-162232/communes-france-2025.csv");
  const ix = (n: string) => header.indexOf(n);
  const I = ix("code_insee"), NE = ix("niveau_equipements_services"), GD = ix("grille_densite"), D = ix("densite");
  if (I < 0) throw new Error(`equipements: code_insee introuvable. Header: ${header.slice(0, 15).join(" | ")}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = [];
  for (const l of lines) {
    const c = splitCsv(l, delim); const insee = (c[I] || "").trim();
    if (!insee) continue;
    const ne = toInt(c[NE]), gd = toInt(c[GD]), d = toInt(c[D]);
    if (ne == null && gd == null && d == null) continue;
    rows.push({ insee_code: insee, niveau_equipements: ne, grille_densite: gd, densite_hab_km2: d });
  }
  await upsert(rows, "Équipements + densité");
}

async function main() {
  console.log(`Enrichissement data.gouv.fr — source=${SRC}${DRY ? " (DRY-RUN)" : ""}\n`);
  const map: Record<string, () => Promise<void>> = { dvf, revenus, logements, equipements };
  const todo = SRC === "all" ? Object.keys(map) : [SRC];
  for (const s of todo) {
    if (!map[s]) { console.error(`source inconnue: ${s}`); continue; }
    console.log(`▶ ${s}`);
    await map[s]();
  }
  console.log("\nFini.");
}
main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
