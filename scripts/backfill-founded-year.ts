/**
 * Backfill `founded_year` (ancienneté) des fiches pro depuis la date de création
 * officielle SIRENE, via l'API gratuite recherche-entreprises.api.gouv.fr (par
 * SIRET). RÈGLE OBLIGATOIRE CLAUDE.md 07/06 : enrichir chaque fiche avec du RÉEL.
 *
 * - Source officielle gratuite, cache-friendly, rate-limit respecté.
 * - Idempotent : ne touche que les pros actifs avec SIRET et SANS founded_year.
 * - Priorité : grosses métropoles + Vienne d'abord (--dept / --ville).
 *
 *   npx tsx scripts/backfill-founded-year.ts --dept 86 --limit 15   # test (dry, montre)
 *   npx tsx scripts/backfill-founded-year.ts --dept 86 --apply      # Vienne (réel)
 *   npx tsx scripts/backfill-founded-year.ts --ville poitiers --apply
 */
import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { fetchCompanyBySiret } from "../lib/utils/recherche-entreprises";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const args = process.argv.slice(2);
const getArg = (k: string) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const APPLY = args.includes("--apply");
const DEPT = getArg("--dept");
const VILLE = getArg("--ville");
const LIMIT = getArg("--limit") ? parseInt(getArg("--limit")!, 10) : APPLY ? 0 : 15;
const RATE_MS = 160; // ~6 req/s, respecte l'API gratuite

type Pro = { id: number; slug: string; name: string; siret: string | null; city_id: number | null };

async function loadAll<T>(table: string, cols: string, f: (q: any) => any): Promise<T[]> {
  const PAGE = 1000; let off = 0; const all: T[] = [];
  while (true) {
    const { data, error } = await f(sb.from(table).select(cols)).range(off, off + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const rows = (data || []) as T[];
    if (rows.length === 0) break;
    all.push(...rows); off += rows.length;
  }
  return all;
}

async function targetCityIds(): Promise<number[] | null> {
  if (VILLE) {
    const { data } = await sb.from("cities").select("id").ilike("slug", VILLE);
    return (data || []).map((c: any) => c.id);
  }
  if (DEPT) {
    const { data: dept } = await sb.from("departments").select("id").eq("code", DEPT.toUpperCase()).single();
    if (!dept) throw new Error(`dept ${DEPT} introuvable`);
    const cities = await loadAll<{ id: number }>("cities", "id", (q) => q.eq("department_id", (dept as any).id));
    return cities.map((c) => c.id);
  }
  return null; // tout le parc
}

async function main() {
  const cityIds = await targetCityIds();
  const scope = VILLE ? `ville=${VILLE}` : DEPT ? `dept=${DEPT} (${cityIds?.length} communes)` : "TOUT LE PARC";
  console.log(`Backfill founded_year · ${scope} · ${APPLY ? "APPLY" : "DRY (montre, n'écrit pas)"}\n`);

  // pros actifs avec siret, sans founded_year, dans le scope
  const pros = await loadAll<Pro>("pros", "id, slug, name, siret, city_id", (q) => {
    let qq = q.eq("is_active", true).is("deleted_at", null).is("founded_year", null).not("siret", "is", null);
    if (cityIds) qq = qq.in("city_id", cityIds);
    return qq;
  });
  const todo = LIMIT > 0 ? pros.slice(0, LIMIT) : pros;
  console.log(`${pros.length} pros sans ancienneté dans le scope · traite ${todo.length}\n`);

  let ok = 0, miss = 0, n = 0;
  for (const p of todo) {
    n++;
    const info = await fetchCompanyBySiret(p.siret!);
    await new Promise((r) => setTimeout(r, RATE_MS));
    const year = info?.foundingDate ? parseInt(info.foundingDate.slice(0, 4), 10) : null;
    // 1900 = sentinel SIRENE "date de création non renseignée" → on rejette
    // (jamais afficher « créée en 1900 »). On garde 1901+ uniquement.
    if (!year || year <= 1900 || year > new Date().getFullYear()) {
      miss++;
      if (!APPLY) console.log(`  – ${p.name.slice(0, 34).padEnd(34)} (pas de date)`);
      continue;
    }
    if (!APPLY) {
      console.log(`  ✓ ${p.name.slice(0, 34).padEnd(34)} → créée en ${year}`);
      ok++;
      continue;
    }
    const { error } = await sb.from("pros").update({ founded_year: year }).eq("id", p.id);
    if (error) { console.log(`  ✗ ${p.slug}: ${error.message}`); continue; }
    ok++;
    if (n % 200 === 0) console.log(`  … ${n}/${todo.length} (${ok} maj)`);
  }
  console.log(`\n${APPLY ? "✅ MAJ" : "DRY"} : ${ok} avec année · ${miss} sans date · ${todo.length} traités`);
}
main().catch((e) => { console.error(e); process.exit(1); });
