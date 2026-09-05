import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main(){
  const { data } = await sb.from("pros").select("slug,name,phone,google_rating,google_reviews_count,rge_certified,forme_juridique,effectif_range")
    .not("google_rating","is",null).eq("is_active",true).is("deleted_at",null).order("google_reviews_count",{ascending:false}).limit(3);
  console.log("fiches AVEC avis Google :"); for(const r of data??[]) console.log(" ", r.google_rating, r.google_reviews_count+" avis", "https://workwave.fr/artisan/"+r.slug);
  const { data: d2 } = await sb.from("pros").select("slug,name,forme_juridique,effectif_range")
    .not("forme_juridique","is",null).neq("forme_juridique","1000").not("effectif_range","is",null).neq("effectif_range","NN")
    .eq("is_active",true).is("deleted_at",null).limit(3);
  console.log("\nfiches avec forme juridique DISTINCTIVE + effectif connu :");
  for(const r of d2??[]) console.log(" ", r.forme_juridique, r.effectif_range, "https://workwave.fr/artisan/"+r.slug);
  const { data: d3 } = await sb.from("pros").select("slug,rge_qualifications").eq("rge_certified",true).eq("is_active",true).is("deleted_at",null).limit(2);
  console.log("\nfiches RGE :"); for(const r of d3??[]) console.log("  https://workwave.fr/artisan/"+r.slug);
}
main().catch(e=>console.error(e.message));
