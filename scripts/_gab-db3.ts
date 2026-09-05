import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const OUVERT = "etat_admin.is.null,etat_admin.neq.F";
async function n(cat: string, citySlug: string) {
  const { data: c } = await sb.from("categories").select("id,name").eq("slug",cat).single();
  const { data: v } = await sb.from("cities").select("id,name,population").eq("slug",citySlug).limit(1).single();
  if (!c || !v) { console.log(cat, citySlug, "introuvable"); return; }
  const { count } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",c.id).eq("city_id",v.id).is("deleted_at",null).eq("is_active",true).or(OUVERT);
  const { count: ferme } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",c.id).eq("city_id",v.id).is("deleted_at",null).eq("is_active",true).eq("etat_admin","F");
  console.log(`${cat.padEnd(16)} x ${v.name.padEnd(14)} (pop ${v.population}) : ${count} ouverts / ${ferme} fermes`);
}
async function main() {
  for (const [c,v] of [["climaticien","lyon"],["chauffagiste","lyon"],["plombier","lyon"],["electricien","lyon"],["plombier","poitiers"],["plombier","bordeaux"],["plombier","montpellier"],["nettoyage-vitres","sartrouville"],["menuisier","samer"],["plaquiste","cluny"],["debarras","gardanne"]]) await n(c,v);
  // combien de pages metier x ville n'ont qu'UN seul pro ?
  console.log("\n-- Distribution du nombre de pros par couple (categorie, ville) --");
  const { data, error } = await sb.rpc("sitemap_category_city_counts" as any).select?.("*") ?? {data:null,error:null} as any;
  if (error || !data) console.log("  (RPC indisponible, mesure faite autrement)");
}
main().catch(e=>console.error(e.message));
