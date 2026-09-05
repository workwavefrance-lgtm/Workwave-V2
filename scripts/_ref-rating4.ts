import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

async function main() {
  const sb = getServiceClient();
  const PAGE = 1000;
  let offset = 0;
  const ok: any[] = [];
  while (true) {
    const { data, error } = await sb
      .from("pros")
      .select("id,slug,name,google_rating,google_reviews_count,city_id,category_id,etat_admin,is_active,deleted_at")
      .not("google_rating", "is", null).order("id").range(offset, offset + PAGE - 1)
      .abortSignal(AbortSignal.timeout(120_000));
    if (error) { console.log("ERR", error.message); break; }
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows) if (r.is_active && !r.deleted_at && r.etat_admin !== "F" && (r.google_reviews_count ?? 0) > 0) ok.push(r);
    offset += rows.length;
  }
  console.log("pros ouverts notes =", ok.length);
  // repartition par ville
  const byCity = new Map<number, any[]>();
  for (const p of ok) { const a = byCity.get(p.city_id) || []; a.push(p); byCity.set(p.city_id, a); }
  const top = [...byCity.entries()].sort((a,b)=>b[1].length-a[1].length).slice(0,8);
  const cityIds = top.map(t=>t[0]);
  const { data: cities } = await sb.from("cities").select("id,name,slug").in("id", cityIds);
  const cmap = new Map(cities!.map((c:any)=>[c.id,c]));
  const catIds = [...new Set(ok.map(p=>p.category_id))];
  const { data: cats } = await sb.from("categories").select("id,slug,name").in("id", catIds);
  const catmap = new Map(cats!.map((c:any)=>[c.id,c]));
  console.log("\nTOP villes (nb pros notes) et URLs listing testables :");
  for (const [cid, arr] of top) {
    const c: any = cmap.get(cid);
    const bycat = new Map<number, number>();
    for (const p of arr) bycat.set(p.category_id, (bycat.get(p.category_id)||0)+1);
    const best = [...bycat.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3);
    console.log(`${c?.name} (${c?.slug}) : ${arr.length} pros notes`);
    for (const [k,v] of best) console.log(`    /${(catmap.get(k) as any)?.slug}/${c?.slug}  -> ${v} pros notes`);
  }
}
main();
