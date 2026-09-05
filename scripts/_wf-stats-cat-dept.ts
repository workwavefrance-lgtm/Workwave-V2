import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

const DEPTS = ["76","67","38","35","95","78","77","94","92","83","06","34","31","44","59","33","69","13","75"];

async function main() {
  const { data, error } = await sb.rpc("stats_etats_cat_dept_json" as any);
  if (error) { console.error("RPC erreur:", error); process.exit(1); }
  const rows = (data || []) as any[];
  console.log("lignes de la vue :", rows.length);
  const dates = [...new Set(rows.map(r => r.calcule_le))];
  console.log("calcule_le distinct :", dates.slice(0, 3), "(n =", dates.length, ")");

  const btp = rows.filter(r => r.vertical === "btp" && DEPTS.includes(r.d));
  const parCat = new Map<string, { o: number; t: number; f: number; depts: Map<string, number> }>();
  for (const r of btp) {
    if (!parCat.has(r.c)) parCat.set(r.c, { o: 0, t: 0, f: 0, depts: new Map() });
    const e = parCat.get(r.c)!;
    e.o += r.o; e.t += r.t; e.f += r.f;
    e.depts.set(r.d, (e.depts.get(r.d) || 0) + r.o);
  }
  const sorted = [...parCat.entries()].sort((a, b) => a[1].o - b[1].o);
  console.log("\n--- FICHES OUVERTES par categorie BTP sur les 19 depts du run (vue materialisee) ---");
  console.log("cat".padEnd(32), "ouvertes".padStart(9), "actives".padStart(9), "depts>0".padStart(8));
  for (const [slug, e] of sorted) {
    const nz = [...e.depts.values()].filter(v => v > 0).length;
    console.log(slug.padEnd(32), String(e.o).padStart(9), String(e.t).padStart(9), String(nz).padStart(8));
  }
  // categories BTP absentes totalement de la vue sur ces depts
  const { data: cats } = await sb.from("categories").select("slug, vertical").eq("vertical", "btp");
  const presentes = new Set(parCat.keys());
  const absentes = (cats || []).map((c: any) => c.slug).filter((s: string) => !presentes.has(s));
  console.log("\ncategories BTP totalement absentes de ces 19 depts :", absentes.join(", ") || "(aucune)");
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
