import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main(){
  for (let i=1;i<=3;i++){
    const t0=Date.now();
    const { data, error } = await sb.rpc("sitemap_dept_cat_counts" as any, { p_min: 1 });
    const dt=(Date.now()-t0)/1000;
    if (error) console.log(`essai ${i}: ECHEC en ${dt}s -> ${error.message}`);
    else console.log(`essai ${i}: OK en ${dt}s, ${(data as any[]).length} couples`);
  }
}
main().then(()=>process.exit(0));
