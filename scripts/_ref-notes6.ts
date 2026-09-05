import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const c = async (label: string, b: (q:any)=>any) => {
  let q = sb.from("pros").select("id",{count:"exact",head:true}).is("deleted_at",null).eq("is_active",true);
  const { count, error } = await b(q);
  console.log(label.padEnd(48), error ? "ERR "+error.message : count);
};
async function main(){
  await c("google_place_id renseigne (match Places tente)", q=>q.not("google_place_id","is",null));
  await c("place_id SANS note (match mais pas d avis)", q=>q.not("google_place_id","is",null).is("google_rating",null));
  await c("google_reviews_count >= 5", q=>q.gte("google_reviews_count",5));
  await c("photos non vide", q=>q.neq("photos","[]").not("photos","is",null));
}
main().catch(e=>console.error(e.message));
