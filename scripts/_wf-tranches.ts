import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb: any = getServiceClient();
const PAR = 45000;
async function existe(skip: number, tech: boolean): Promise<boolean | null> {
  for (let i = 0; i < 4; i++) {
    const { data, error } = await sb.rpc("sitemap_batch_start_id", { skip_count: skip, tech_mode: tech });
    if (!error) return data !== null;
    await new Promise((r) => setTimeout(r, 3000));
  }
  return null;
}
(async () => {
  console.log("NON TECH (sitemap /artisan, tranches 100+N) :");
  for (let k = 40; k <= 62; k++) {
    const r = await existe(k * PAR, false);
    console.log(`  tranche ${100 + k} (skip ${k * PAR}) : ${r === null ? "RPC KO" : r ? "a des fiches" : "VIDE"}`);
    if (r === false) break;
  }
  console.log("TECH (sitemap /ai/freelance, tranches 200+N) :");
  for (let k = 11; k <= 16; k++) {
    const r = await existe(k * PAR, true);
    console.log(`  tranche ${200 + k} (skip ${k * PAR}) : ${r === null ? "RPC KO" : r ? "a des fiches" : "VIDE"}`);
    if (r === false) break;
  }
})();
