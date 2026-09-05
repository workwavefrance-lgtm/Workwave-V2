import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main(){
  const { data, error } = await sb.from("categories").select("id, slug, vertical, naf_codes").in("vertical",["btp","domicile","personne"]).order("id");
  if (error) throw new Error(error.message);
  for (const c of data as any[]) {
    console.log(String(c.id).padStart(4), c.vertical.padEnd(9), c.slug.padEnd(26), (c.naf_codes||[]).join(","));
  }
  console.log("total cats non-tech:", (data as any[]).length);
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERREUR:",e.message);process.exit(1);});
