import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import { haversineKm } from "../lib/utils/haversine";

const OUVERTS = "etat_admin.is.null,etat_admin.neq.F";

async function main() {
  const sb = getServiceClient();
  const { data: cat } = await sb.from("categories").select("id,slug,name").eq("slug", "plombier").single();
  const catId = (cat as any).id as number;
  console.log("categorie", cat);

  const slugs = ["marseille","toulouse","poitiers","limoges","niort","chartres","cholet","millau","loudun","saint-savin"];
  const { data: villes } = await sb
    .from("cities")
    .select("id,slug,name,population,latitude,longitude,department_id")
    .in("slug", slugs);

  // toutes les communes avec coords, chargees une fois (pagination 1000)
  const all: any[] = [];
  let off = 0;
  while (true) {
    const { data } = await sb.from("cities").select("id,latitude,longitude").not("latitude","is",null).range(off, off + 999);
    const rows = data || [];
    if (rows.length === 0) break;
    all.push(...rows);
    off += rows.length;
  }
  console.log("communes avec coords :", all.length);

  const compte = async (ids: number[]) => {
    if (ids.length === 0) return 0;
    let total = 0;
    for (let i = 0; i < ids.length; i += 400) {
      const lot = ids.slice(i, i + 400);
      const { count, error } = await sb.from("pros").select("id", { count: "exact", head: true })
        .eq("category_id", catId).in("city_id", lot)
        .is("deleted_at", null).eq("is_active", true).or(OUVERTS);
      if (error) throw new Error(error.message);
      total += count || 0;
    }
    return total;
  };

  for (const s of slugs) {
    const v = (villes || []).find((x: any) => x.slug === s);
    if (!v) { console.log(s, "INTROUVABLE"); continue; }
    const d10: number[] = [], d20: number[] = [], d30: number[] = [];
    for (const c of all) {
      const km = haversineKm(v.latitude, v.longitude, c.latitude, c.longitude);
      if (km <= 30) { d30.push(c.id); if (km <= 20) d20.push(c.id); if (km <= 10) d10.push(c.id); }
    }
    const commune = await compte([v.id]);
    const c10 = await compte(d10), c20 = await compte(d20), c30 = await compte(d30);
    console.log(JSON.stringify({ ville: v.name, slug: s, pop: v.population, commune, r10: c10, r20: c20, r30: c30, communes10: d10.length, communes30: d30.length }));
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
