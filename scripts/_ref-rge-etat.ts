import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main() {
  const c = async (f:(q:any)=>any, label:string) => {
    const { count, error } = await f(sb.from("pros").select("id",{count:"exact",head:true}));
    console.log(label.padEnd(52), error ? "ERR "+error.message : count);
  };
  await c((q)=>q.eq("rge_certified",true).is("deleted_at",null).eq("is_active",true), "rge_certified=true (actifs)");
  await c((q)=>q.eq("rge_certified",true).not("rge_qualifications","is",null).is("deleted_at",null).eq("is_active",true), "rge_certified + rge_qualifications non null");
  await c((q)=>q.eq("rge_certified",true).eq("etat_admin","F").is("deleted_at",null).eq("is_active",true), "rge_certified MAIS etablissement FERME");
  // fiche citee par l'audit
  const { data } = await sb.from("pros").select("id,slug,name,etat_admin,phone,email,website,rge_certified,forme_juridique,effectif_range,founded_year,description").eq("slug","pascal-bara-00026").limit(1);
  console.log("\nfiche citee par l'audit :", JSON.stringify(data?.[0], null, 1));
}
main().catch(e=>console.error(e.message));
