import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main() {
  const { data } = await sb.from("categories").select("id,slug,naf_codes").in("id",[5,36,10]);
  console.log(JSON.stringify(data, null, 1));
  // retente le comptage menuisier
  for (const essai of [1,2]) {
    const t0 = Date.now();
    const { count, error } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",5);
    console.log(`menuisier essai ${essai} : count=${count} err=${error?.message||"-"} (${Date.now()-t0} ms)`);
    if (count !== null) break;
  }
}
main();
