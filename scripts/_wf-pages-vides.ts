import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main() {
  const t0 = Date.now();
  const { data, error } = await sb.rpc("sitemap_dept_cat_counts" as any, { p_min: 1 });
  if (error) { console.error("RPC erreur :", error.message); process.exit(1); }
  const rows = (data || []) as { c: number; d: number; n: number }[];
  console.log(`RPC en ${(Date.now()-t0)/1000}s, ${rows.length} couples (cat,dept) avec >=1 ouvert`);
  const { data: cats } = await sb.from("categories").select("id, slug, vertical").in("vertical", ["btp","domicile","personne"]);
  const { data: deps } = await sb.from("departments").select("id, code, country").eq("country", "FR");
  const nbDeps = (deps as any[]).length;
  const has = new Set(rows.map(r => `${r.c}:${r.d}`));
  const depIds = (deps as any[]).map(d => d.id);
  console.log("departements FR :", nbDeps);
  const manque: {slug:string; vertical:string; vides:number}[] = [];
  for (const c of cats as any[]) {
    let v = 0; for (const d of depIds) if (!has.has(`${c.id}:${d}`)) v++;
    if (v > 0) manque.push({ slug: c.slug, vertical: c.vertical, vides: v });
  }
  manque.sort((a,b)=>b.vides-a.vides);
  console.log("\n--- pages /metier/dept SANS AUCUN pro ouvert (sur", nbDeps, "depts FR) ---");
  for (const m of manque) console.log(`${m.slug.padEnd(32)} ${m.vertical.padEnd(9)} ${String(m.vides).padStart(4)} depts vides`);
  console.log("\nTOTAL pages metier x dept vides :", manque.reduce((s,m)=>s+m.vides,0));
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message||e);process.exit(1);});
