import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const BASE = "https://workwave.fr";
async function main() {
  const sb = getServiceClient();
  // toutes les fiches OUVERTES d une meme commune + meme metier (Poitiers, plombier)
  const { data: ville } = await sb.from("cities").select("id").eq("slug", "poitiers").limit(1);
  const { data: cat } = await sb.from("categories").select("id").eq("slug", "plombier").limit(1);
  const { data: pros, count } = await sb.from("pros").select("slug", { count: "exact" })
    .eq("city_id", ville![0].id).eq("category_id", cat![0].id)
    .eq("is_active", true).is("deleted_at", null).eq("etat_admin", "A").limit(60);
  console.log(`plombiers OUVERTS a Poitiers en base : ${count} (echantillon ${pros!.length})`);
  const cibles = new Map<string, number>(); let emis = 0, pages = 0;
  for (let i = 0; i < pros!.length; i += 6) {
    const res = await Promise.all(pros!.slice(i, i + 6).map(async (p: any) => {
      const r = await fetch(`${BASE}/artisan/${p.slug}`, { redirect: "manual" });
      if (r.status !== 200) return [];
      const h = await r.text();
      return [...new Set([...h.matchAll(/href="\/artisan\/([^"]+)"/g)].map(m => m[1]))].filter(s => s !== p.slug);
    }));
    for (const ls of res) { if (ls.length) pages++; emis += ls.length; for (const t of ls) cibles.set(t, (cibles.get(t) || 0) + 1); }
  }
  console.log(`pages lues : ${pages}, liens "pros similaires" emis : ${emis}, fiches distinctes visees : ${cibles.size}`);
  const top = [...cibles].sort((a,b)=>b[1]-a[1]).slice(0,5);
  console.log(`concentration : les 5 fiches les plus liees recoivent ${top.reduce((s,x)=>s+x[1],0)} des ${emis} liens`);
  console.log("top5 :", top.map(x=>`${x[0]} (${x[1]})`).join(", "));
  // combien des 'count' plombiers ouverts de Poitiers sont vises ?
  const tousSlugs = new Set(pros!.map((p:any)=>p.slug));
  const visesDansLot = [...cibles.keys()].filter(s => tousSlugs.has(s)).length;
  console.log(`fiches du lot recevant au moins un lien interne de leurs voisines : ${visesDansLot}/${pros!.length}`);
}
main();
