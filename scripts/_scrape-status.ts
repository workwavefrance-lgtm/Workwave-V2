/**
 * Statut RÉEL du scrape France : count net de pros actifs par département en base
 * (jamais se fier aux logs "envoyés à upsert"). Throwaway (préfixe _).
 * Usage : npx tsx scripts/_scrape-status.ts
 */
import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

type Dept = { id: number; code: string; name: string; region: string };

async function loadAll<T>(table: string, cols: string): Promise<T[]> {
  const PAGE = 1000; let off = 0; const all: T[] = [];
  while (true) {
    const { data, error } = await sb.from(table).select(cols).range(off, off + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    const rows = (data || []) as T[];
    if (rows.length === 0) break;
    all.push(...rows); off += rows.length;
  }
  return all;
}

async function countProsInDept(deptId: number): Promise<number> {
  // count pros actifs via join inner sur cities.department_id (1 query/dept)
  const { count, error } = await sb
    .from("pros")
    .select("id, cities!inner(department_id)", { count: "exact", head: true })
    .eq("cities.department_id", deptId)
    .eq("is_active", true)
    .is("deleted_at", null);
  if (error) throw new Error(`count dept ${deptId}: ${error.message}`);
  return count || 0;
}

async function main() {
  const depts = (await loadAll<Dept>("departments", "id, code, name, region")).sort((a, b) =>
    a.region === b.region ? a.code.localeCompare(b.code) : a.region.localeCompare(b.region)
  );
  console.log(`${depts.length} départements en base. Comptage du net pros actifs/dept…\n`);

  let grand = 0;
  const empties: string[] = [];
  const byRegion = new Map<string, number>();
  let lastRegion = "";
  for (const d of depts) {
    const n = await countProsInDept(d.id);
    grand += n;
    byRegion.set(d.region, (byRegion.get(d.region) || 0) + n);
    if (n === 0) empties.push(`${d.code} ${d.name}`);
    if (d.region !== lastRegion) { console.log(`\n## ${d.region}`); lastRegion = d.region; }
    const flag = n === 0 ? " ⚠️ VIDE" : n < 200 ? " ⚠️ faible" : "";
    console.log(`  ${d.code.padEnd(4)} ${d.name.padEnd(26)} ${String(n).padStart(7)}${flag}`);
  }

  console.log(`\n============================================================`);
  console.log(`GRAND TOTAL net pros actifs : ${grand.toLocaleString("fr-FR")}`);
  console.log(`Départements VIDES (0 pro) : ${empties.length}`);
  if (empties.length) console.log(`  → ${empties.join(" · ")}`);
  console.log(`\nPar région :`);
  for (const [r, n] of [...byRegion.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${r.padEnd(30)} ${n.toLocaleString("fr-FR").padStart(9)}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
