import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  for (const pid of [75, 74, 71]) {
    const { data: pr, error } = await sb.from("projects").select("*").eq("id", pid).single();
    if (error) { console.log(`#${pid} ERREUR: ${error.message}`); continue; }
    const cols = Object.keys(pr);
    // affiche les champs utiles s'ils existent
    const pick = (k: string) => (k in pr ? pr[k] : "·");
    console.log(`\n══ Projet #${pid} ══`);
    console.log(`  cat_id=${pick("category_id")} city_id=${pick("city_id")} status=${pick("status")} urgency=${pick("urgency")} budget=${pick("budget_estimated")} broadcast=${pick("broadcast_count")}`);
    console.log(`  client: ${pick("first_name")} ${pick("last_name")||""} | tel=${pick("phone")} | email=${pick("email")}`);
    console.log(`  desc: ${String(pick("description")||"").slice(0,400)}`);
    if (pid === 75) console.log(`  [colonnes dispo: ${cols.join(", ")}]`);
  }
}
main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
