import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // l'offset qui timeoutait ce matin (1 755 000) + bornes
  for (const [skip, tech] of [[450000, false], [1125000, false], [1755000, false], [2500000, false], [450000, true]] as [number, boolean][]) {
    const t0 = Date.now();
    const { data, error } = await sb.rpc("sitemap_batch_start_id", { skip_count: skip, tech_mode: tech });
    const ms = Date.now() - t0;
    if (error) console.log(`skip ${skip} tech=${tech} : ❌ ${error.message} (${ms}ms)`);
    else console.log(`skip ${skip} tech=${tech} : id=${data ?? "null (hors-borne)"} en ${ms}ms`);
  }
}
main();
