/**
 * Diagnostic : pourquoi 280 erreurs et 0 succès sur la campagne cold email avril 2026 ?
 */
import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // 1. Tables existantes liées aux cold emails ?
  console.log("══ Tables potentielles ══");
  const tables = ["cold_emails", "email_sequences", "cold_email_logs", "brevo_logs", "email_logs"];
  for (const t of tables) {
    const { count, error } = await sb.from(t).select("*", { count: "exact", head: true });
    if (!error) console.log(`  ${t} : ${count ?? 0} rows`);
  }

  // 2. Sample d'erreurs sur cold_emails (table la + probable)
  console.log("\n══ Échantillon de records 'failed' avec message d'erreur ══");
  const { data: samples } = await sb
    .from("cold_emails")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);
  console.log(samples?.[0] ? JSON.stringify(samples[0], null, 2) : "(rien)");

  // 3. Compte par statut
  console.log("\n══ Compte par statut ══");
  const { data: agg } = await sb.from("cold_emails").select("status");
  const counts: Record<string, number> = {};
  for (const r of agg || []) counts[r.status || "null"] = (counts[r.status || "null"] || 0) + 1;
  console.log(counts);

  // 4. Erreurs distinctes
  console.log("\n══ Messages d'erreur distincts (top 5) ══");
  const { data: errs } = await sb
    .from("cold_emails")
    .select("error_message, brevo_error, last_error")
    .not("error_message", "is", null)
    .limit(20);
  const errCount: Record<string, number> = {};
  for (const e of errs || []) {
    const msg = e.error_message || e.brevo_error || e.last_error || "(empty)";
    errCount[msg] = (errCount[msg] || 0) + 1;
  }
  Object.entries(errCount).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([msg, n]) => {
    console.log(`  [${n}×] ${msg.slice(0, 200)}`);
  });
}
main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
