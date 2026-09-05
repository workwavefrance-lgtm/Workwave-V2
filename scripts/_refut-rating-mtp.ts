import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main(){
  const sb=getServiceClient();
  const {data:cat}=await sb.from("categories").select("id,slug").eq("slug","plombier").single();
  const {data:city}=await sb.from("cities").select("id,name,slug").eq("slug","montpellier").limit(5);
  console.log("cat",cat,"cities",city);
  const cid=city?.[0]?.id;
  const tot=await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",cat!.id).eq("city_id",cid).eq("is_active",true).is("deleted_at",null);
  console.log("pros plombier Montpellier actifs:",tot.count);
  const withR=await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",cat!.id).eq("city_id",cid).eq("is_active",true).is("deleted_at",null).not("google_rating","is",null);
  console.log("dont avec google_rating:",withR.count);
  // combien de villes ont >=1 pro note
  const {data:rated}=await sb.from("pros").select("city_id,category_id").not("google_rating","is",null).eq("is_active",true).limit(2000);
  const combos=new Set((rated||[]).map(r=>`${r.category_id}|${r.city_id}`));
  console.log("combos cat|ville distincts ayant >=1 pro note (echantillon 2000):",combos.size);
}
main();
