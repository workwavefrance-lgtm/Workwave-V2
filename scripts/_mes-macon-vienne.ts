import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data: cat } = await sb.from("categories").select("id").eq("slug","macon").single();
  const { data: dep } = await sb.from("departments").select("id").eq("code","86").single();
  const { data: villes } = await sb.from("cities").select("id").eq("department_id", dep!.id);
  const ids = (villes||[]).map(v=>v.id);
  const base = () => sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",cat!.id).in("city_id",ids).eq("is_active",true).is("deleted_at",null);
  const { count: tous } = await base();
  const { count: ouverts } = await base().eq("etat_admin","A");
  console.log(`macon x Vienne : total actif=${tous}  ouverts=${ouverts}  fermes=${(tous!)-(ouverts!)}`);
  console.log(`pagination servie : 14 pages x 20 = 279 fiches atteignables`);
  console.log(`fiches ouvertes NON atteignables par lien interne : ${(ouverts!)-279}`);
})();
