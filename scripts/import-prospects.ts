/**
 * Import du CSV de moisson Google Maps (mobiles) dans la table `prospects`.
 *
 * - normalise les numéros (0XXXXXXXXX), garde uniquement les mobiles 06/07
 * - résout category_id par lookup en base (categories.slug) — pas de map hardcodé
 * - mappe ville -> code département (table CITY_DEPT ci-dessous)
 * - DÉDUP vs fiches `pros` existantes par numéro (anti double-contact / anti-mismatch)
 * - upsert onConflict(phone) ignoreDuplicates => ré-exécutable sans créer de doublon
 *
 * USAGE :
 *   npx tsx scripts/import-prospects.ts --dry-run     (défaut, n'écrit rien)
 *   npx tsx scripts/import-prospects.ts --execute
 *   (--file=<chemin csv> ; défaut ~/Desktop/workwave-mobiles-harvest.csv)
 *
 * Prérequis : migration migrations/2026-06-04_prospects.sql appliquée.
 */
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function arg(name: string): string | undefined {
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.split("=")[1] : undefined;
}
const FILE = arg("file") || path.resolve(process.env.HOME!, "Desktop/workwave-mobiles-harvest.csv");
const EXECUTE = process.argv.includes("--execute");
const DRY_RUN = !EXECUTE;

// Villes de la moisson -> code département (les 54 villes ratissées)
const CITY_DEPT: Record<string, string> = {
  Gradignan: "33", Bordeaux: "33", Libourne: "33", Arcachon: "33",
  Poitiers: "86", Chatellerault: "86",
  Toulouse: "31", Montpellier: "34", Beziers: "34", Nimes: "30",
  Narbonne: "11", Carcassonne: "11", Albi: "81", Cahors: "46", Auch: "32", Rodez: "12",
  Perpignan: "66",
  Nantes: "44", "Saint-Nazaire": "44", Angers: "49", Cholet: "49",
  "Le Mans": "72", "La Roche-sur-Yon": "85", Laval: "53",
  Rennes: "35", Vannes: "56", Lorient: "56", Quimper: "29", Brest: "29", "Saint-Brieuc": "22",
  Marseille: "13", "Aix-en-Provence": "13", Nice: "06", Antibes: "06", Cannes: "06",
  Toulon: "83", Frejus: "83", Draguignan: "83", Avignon: "84", Gap: "05",
  Limoges: "87", "Brive-la-Gaillarde": "19", Perigueux: "24", Bergerac: "24",
  Niort: "79", "La Rochelle": "17", Saintes: "17", Angouleme: "16",
  Pau: "64", Bayonne: "64", Agen: "47", "Mont-de-Marsan": "40", Dax: "40", Tarbes: "65",
};

// Alias slug CSV -> slug DB quand ils diffèrent
const SLUG_ALIAS: Record<string, string> = {
  nettoyage: "nettoyage-pro",
};

function normPhone(s: string): string | null {
  const d = (s || "").replace(/\D/g, "").replace(/^33/, "0");
  if (!/^0[67]\d{8}$/.test(d)) return null; // mobiles uniquement
  return d;
}

async function main() {
  console.log(`\n=== IMPORT PROSPECTS — ${DRY_RUN ? "DRY-RUN" : "EXECUTE"} ===\n`);

  // 1) Charger le CSV
  const lines = fs.readFileSync(FILE, "utf-8").trim().split("\n").slice(1);
  const rows = lines
    .map((l) => {
      const [name, city, categorie, mobile] = l.split(";");
      return { name, city, category_slug: (categorie || "").trim(), phone: normPhone(mobile) };
    })
    .filter((r) => r.phone && r.name && r.category_slug);
  console.log(`CSV : ${lines.length} lignes -> ${rows.length} mobiles valides`);

  // 2) Résoudre category_id par lookup (categories.slug)
  const slugsWanted = [...new Set(rows.map((r) => SLUG_ALIAS[r.category_slug] || r.category_slug))];
  const { data: cats } = await sb.from("categories").select("id, slug").in("slug", slugsWanted);
  const slugToId = new Map<string, number>((cats || []).map((c: any) => [c.slug, c.id]));
  const missing = slugsWanted.filter((s) => !slugToId.has(s));
  if (missing.length) console.log(`⚠️  slugs sans category_id : ${missing.join(", ")}`);

  // 3) DÉDUP vs pros existants (par numéro normalisé)
  const prosPhones = new Set<string>();
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data } = await sb
      .from("pros")
      .select("phone")
      .not("phone", "is", null)
      .order("id", { ascending: true })
      .range(offset, offset + PAGE - 1);
    const batch = data || [];
    if (batch.length === 0) break;
    for (const p of batch) {
      const n = normPhone((p as any).phone);
      if (n) prosPhones.add(n);
    }
    offset += batch.length;
  }
  console.log(`Fiches pros avec mobile en base : ${prosPhones.size}`);

  // 4) Construire les rows prospects (dédup CSV interne + vs pros)
  const seen = new Set<string>();
  const toInsert = rows
    .filter((r) => {
      if (seen.has(r.phone!)) return false;
      seen.add(r.phone!);
      return !prosPhones.has(r.phone!); // exclut ceux déjà sur une fiche pros
    })
    .map((r) => {
      const slug = SLUG_ALIAS[r.category_slug] || r.category_slug;
      return {
        name: r.name,
        category_slug: slug,
        category_id: slugToId.get(slug) ?? null,
        city: r.city,
        department_code: CITY_DEPT[r.city] ?? null,
        phone: r.phone!,
        source: "google_maps",
      };
    });

  const dejaSurPros = rows.length - seen.size + [...seen].filter((p) => prosPhones.has(p)).length;
  console.log(`À insérer dans prospects : ${toInsert.length}`);
  console.log(`Exclus (déjà sur une fiche pros) : ${[...seen].filter((p) => prosPhones.has(p)).length}`);
  const sansDept = toInsert.filter((r) => !r.department_code).map((r) => r.city);
  if (sansDept.length) console.log(`⚠️  villes sans dept mappé : ${[...new Set(sansDept)].join(", ")}`);

  if (DRY_RUN) {
    console.log("\n[DRY-RUN] 5 premiers :");
    toInsert.slice(0, 5).forEach((r) => console.log(`  ${r.name} | ${r.category_slug}(${r.category_id}) | ${r.city}(${r.department_code}) | ${r.phone}`));
    console.log("\n--execute pour insérer.");
    return;
  }

  // 5) Insert idempotent (upsert onConflict phone, ignore duplicates)
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += 500) {
    const chunk = toInsert.slice(i, i + 500);
    const { error, count } = await sb
      .from("prospects")
      .upsert(chunk, { onConflict: "phone", ignoreDuplicates: true, count: "exact" });
    if (error) { console.error(`❌ batch ${i}: ${error.message}`); continue; }
    inserted += count ?? chunk.length;
  }
  console.log(`\n✓ ${inserted} prospects importés (table prospects).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
