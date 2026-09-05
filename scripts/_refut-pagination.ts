import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

async function main() {
  const sb = getServiceClient();
  // categorie macon + dept 86
  const { data: cat } = await sb.from("categories").select("id,slug").eq("slug", "macon").single();
  const { data: dept } = await sb.from("departments").select("id,code").eq("code", "86").single();
  console.log("cat macon:", cat, "dept 86:", dept);
  const { data: villes } = await sb.from("cities").select("id").eq("department_id", dept!.id).limit(2000);
  const ids = (villes || []).map((v: any) => v.id);
  console.log("villes 86:", ids.length);

  const { count: total } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("category_id", cat!.id).in("city_id", ids).eq("is_active", true).is("deleted_at", null);
  const { count: ouverts } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("category_id", cat!.id).in("city_id", ids).eq("is_active", true).is("deleted_at", null)
    .or("etat_admin.is.null,etat_admin.neq.F");
  console.log("macon/86 : actifs =", total, " ouverts =", ouverts);

  // Echantillon de 8 slugs au hasard (au dela du top 10 forcement)
  const { data: sample } = await sb.from("pros").select("id,slug,name,etat_admin")
    .eq("category_id", cat!.id).in("city_id", ids).eq("is_active", true).is("deleted_at", null)
    .or("etat_admin.is.null,etat_admin.neq.F").order("id", { ascending: false }).limit(8);
  console.log("echantillon (ids les plus hauts, donc PAS dans le top 10 alpha/score):");
  for (const p of sample || []) console.log("  ", p.id, p.slug);
}
main();
