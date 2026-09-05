import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  const paires = [["plombier","Nord"],["plombier","Vienne"],["menuisier","Bouches-du-Rhone"],["serrurier","Rhone"],["ramoneur","Creuse"],["paysagiste","Gironde"]];
  for (const [m, d] of paires) {
    const { data: cat } = await sb.from("categories").select("id").eq("slug", m).limit(1);
    const { data: dep } = await sb.from("departments").select("id,code").ilike("name", d).limit(1);
    if (!cat?.length || !dep?.length) { console.log(m, d, "introuvable"); continue; }
    const { data: villes } = await sb.from("cities").select("id").eq("department_id", dep[0].id).limit(2000);
    const ids = villes!.map((v: any) => v.id);
    const set = new Set<number>(); let tot = 0;
    for (let i = 0; i < ids.length; i += 200) {
      const { data } = await sb.from("pros").select("city_id").eq("category_id", cat[0].id)
        .in("city_id", ids.slice(i, i + 200)).eq("is_active", true).is("deleted_at", null).eq("etat_admin", "A").limit(5000);
      for (const p of (data || []) as any[]) { set.add(p.city_id); tot++; }
    }
    console.log(`/${m}/${d} (${dep[0].code}) : ${tot} pros ouverts repartis sur ${set.size} communes (la page dept en lie 11 aujourd hui)`);
  }
}
main();
