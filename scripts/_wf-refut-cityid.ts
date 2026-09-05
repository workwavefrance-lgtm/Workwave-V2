import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DEBUT = "2026-09-05T00:00:00+02:00";
const FIN   = "2026-09-06T00:00:00+02:00";
async function c(label: string, q: any, essais = 4) {
  for (let i = 0; i < essais; i++) {
    const { count, error } = await q;
    if (!error && count !== null && count !== undefined) { console.log(`${label}: ${count}`); return count; }
    if (i === essais - 1) console.log(`${label}: ECHEC (err="${error?.message ?? "null"}")`);
    else await new Promise(r => setTimeout(r, 4000));
  }
  return null;
}
async function main() {
  await c("cree le 05/09 avec city_id NULL", sb.from("pros").select("id", { count: "exact", head: true })
    .gte("created_at", DEBUT).lt("created_at", FIN).is("city_id", null));
  await c("cree le 05/09 avec city_id renseigne", sb.from("pros").select("id", { count: "exact", head: true })
    .gte("created_at", DEBUT).lt("created_at", FIN).not("city_id", "is", null));
}
main();
