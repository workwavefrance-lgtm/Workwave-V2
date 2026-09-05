import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // 1. Sample
  console.log("══ email_sequences sample ══");
  const { data: seq } = await sb.from("email_sequences").select("*").order("created_at", { ascending: false }).limit(1);
  if (seq?.[0]) console.log(JSON.stringify(seq[0], null, 2));

  // 2. Compte par statut
  const { data: agg } = await sb.from("email_sequences").select("status");
  const counts: Record<string, number> = {};
  for (const r of agg || []) counts[r.status || "null"] = (counts[r.status || "null"] || 0) + 1;
  console.log("\n══ email_sequences · répartition par status ══");
  console.log(counts);

  // 3. email_logs
  console.log("\n══ email_logs sample ══");
  const { data: logs } = await sb.from("email_logs").select("*").order("created_at", { ascending: false }).limit(3);
  console.log(logs);

  // 4. Erreurs distinctes email_logs
  console.log("\n══ email_logs · erreurs distinctes ══");
  const { data: errs } = await sb.from("email_logs").select("*").not("status", "eq", "sent").limit(50);
  const errCount: Record<string, number> = {};
  for (const e of errs || []) {
    const key = `[${e.status}] ${e.error_message || e.error || "(no msg)"}`;
    errCount[key] = (errCount[key] || 0) + 1;
  }
  Object.entries(errCount).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, n]) => {
    console.log(`  [${n}×] ${k.slice(0, 220)}`);
  });
}
main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
