import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

const DEBUT = "2026-09-05T00:00:00+02:00"; // le run entier a tourne le 05/09
const FIN   = "2026-09-06T00:00:00+02:00";

async function compte(nom: string, q: any) {
  const t0 = Date.now();
  const { count, error } = await q;
  const ms = Date.now() - t0;
  if (error) { console.log(`  ${nom.padEnd(34)} ERREUR: ${error.message} (${ms} ms)`); return null; }
  if (count === null || count === undefined) { console.log(`  ${nom.padEnd(34)} count NULL = ERREUR (${ms} ms)`); return null; }
  console.log(`  ${nom.padEnd(34)} ${String(count).padStart(8)}  (${ms} ms)`);
  return count as number;
}

async function main() {
  console.log("=== total pros crees le 05/09/2026 ===");
  await compte("tous", sb.from("pros").select("id", { count: "exact", head: true })
    .gte("created_at", DEBUT).lt("created_at", FIN));
  await compte("dont source=sirene", sb.from("pros").select("id", { count: "exact", head: true })
    .gte("created_at", DEBUT).lt("created_at", FIN).eq("source", "sirene"));
}
main();
