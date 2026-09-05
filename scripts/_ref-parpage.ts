import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  // villes -> dept
  const villeDept = new Map<string, number>();
  let off = 0;
  while (true) {
    const { data } = await sb.from("cities").select("slug,department_id").range(off, off+999);
    const rows = (data||[]) as any[]; if (!rows.length) break;
    for (const r of rows) villeDept.set(r.slug, r.department_id);
    off += rows.length;
  }
  console.log("communes chargees :", villeDept.size);
  const parPageDept = new Map<string, number>();
  off = 0; let total = 0;
  while (true) {
    const { data } = await sb.from("listing_cat_ville").select("metier,ville").order("n",{ascending:false}).order("metier").order("ville").range(off, off+999);
    const rows = (data||[]) as any[]; if (!rows.length) break;
    for (const r of rows) { const d = villeDept.get(r.ville); if (d === undefined) continue; const k = `${r.metier}|${d}`; parPageDept.set(k, (parPageDept.get(k)||0)+1); total++; }
    off += rows.length;
  }
  const vals = [...parPageDept.values()].sort((a,b)=>a-b);
  const moy = vals.reduce((a,b)=>a+b,0)/vals.length;
  console.log(`couples >=3 rattaches a un dept : ${total}`);
  console.log(`pages departement concernees (metier x dept) : ${vals.length}`);
  console.log(`communes a lister par page dept : moyenne ${moy.toFixed(1)}, mediane ${vals[Math.floor(vals.length/2)]}, p90 ${vals[Math.floor(vals.length*0.9)]}, max ${vals[vals.length-1]}`);
  const { count: nbCat } = await sb.from("categories").select("*", { count: "exact", head: true }).in("vertical", ["btp","domicile","personne"]);
  const { count: nbDept } = await sb.from("departments").select("*", { count: "exact", head: true });
  console.log(`categories non tech : ${nbCat} · departements : ${nbDept} · combinaisons possibles : ${(nbCat||0)*(nbDept||0)}`);
}
main();
