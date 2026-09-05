import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DEBUT = "2026-09-05T00:00:00+02:00";
const FIN   = "2026-09-06T00:00:00+02:00";

async function c(label: string, q: any, essais = 3) {
  for (let i = 0; i < essais; i++) {
    const t0 = Date.now();
    const { count, error } = await q;
    if (!error && count !== null && count !== undefined) { console.log(`${label}: ${count}  (${Date.now()-t0} ms)`); return; }
    if (i === essais - 1) console.log(`${label}: ECHEC apres ${essais} essais (err="${error?.message ?? "count null"}", ${Date.now()-t0} ms)`);
    else await new Promise(r => setTimeout(r, 3000));
  }
}

async function main() {
  await c("total cree le 05/09 (relecture 1)", sb.from("pros").select("id", { count: "exact", head: true }).gte("created_at", DEBUT).lt("created_at", FIN));
  await c("total cree le 05/09 (relecture 2)", sb.from("pros").select("id", { count: "exact", head: true }).gte("created_at", DEBUT).lt("created_at", FIN));
  await c("cree a partir du 06/09 (apres le run)", sb.from("pros").select("id", { count: "exact", head: true }).gte("created_at", FIN));
}
main();
