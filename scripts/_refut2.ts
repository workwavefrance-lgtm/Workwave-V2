import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";

async function main() {
  const sb = getServiceClient();
  const { data: villes } = await sb.from("cities").select("id").eq("department_id", 1).limit(2000);
  const ids = (villes || []).map((v: any) => v.id);
  const { data: sample, error } = await sb.from("pros").select("id,slug,name,etat_admin,updated_at")
    .eq("category_id", 3).in("city_id", ids).eq("is_active", true).is("deleted_at", null)
    .not("etat_admin", "eq", "F").order("id", { ascending: true }).limit(2000);
  if (error) { console.log("ERR", error.message); return; }
  const s = sample || [];
  console.log("lignes ramenees:", s.length);
  // 6 au hasard reparties
  const pick = [0, Math.floor(s.length*0.2), Math.floor(s.length*0.4), Math.floor(s.length*0.6), Math.floor(s.length*0.8), s.length-1];
  for (const i of pick) if (s[i]) console.log(s[i].id, s[i].slug);
}
main();
