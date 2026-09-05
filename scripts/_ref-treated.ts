import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  const PAGE = 1000; let offset = 0; const rated: any[] = [];
  while (true) {
    let rows: any[] | null = null;
    for (let att=0; att<4 && !rows; att++) {
      const { data, error } = await sb.from("pros")
        .select("category_id,city_id,is_active,deleted_at,etat_admin,google_reviews_count")
        .not("google_rating","is",null).order("id").range(offset, offset+PAGE-1)
        .abortSignal(AbortSignal.timeout(120_000));
      if (error) { console.log("  retry", offset, error.message); continue; }
      rows = data || [];
    }
    if (!rows) throw new Error("echec page "+offset);
    if (!rows.length) break;
    for (const r of rows) if (r.is_active && !r.deleted_at && r.etat_admin!=="F" && (r.google_reviews_count??0)>0) rated.push(r);
    offset += rows.length;
  }
  const catIds=[...new Set(rated.map(r=>r.category_id))], cityIds=[...new Set(rated.map(r=>r.city_id))];
  const { data: cats } = await sb.from("categories").select("id,slug").in("id",catIds);
  const cmap = new Map((cats as any[]).map(c=>[c.id,c.slug]));
  const citymap = new Map<number,string>();
  for (let i=0;i<cityIds.length;i+=400) {
    const { data: cs } = await sb.from("cities").select("id,slug").in("id", cityIds.slice(i,i+400));
    for (const c of cs as any[]) citymap.set(c.id, c.slug);
  }
  const treated: string[] = [], cities: string[] = [];
  for (const r of rated) {
    const cs = cmap.get(r.category_id), vs = citymap.get(r.city_id);
    if (cs && vs) { treated.push(`/${cs}/${vs}`); cities.push(vs); }
  }
  const out = { treated:[...new Set(treated)], cities:[...new Set(cities)], nbProsNotes: rated.length };
  fs.writeFileSync("/tmp/treated.json", JSON.stringify(out));
  console.log("pros ouverts notes =", rated.length, "| couples =", out.treated.length, "| villes =", out.cities.length);
}
main();
