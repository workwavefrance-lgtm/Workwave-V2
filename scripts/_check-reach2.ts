import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function emailCov(deptCode: string, label: string) {
  const pre = deptCode.padStart(2, "0");
  const { count: tot, error: e1 } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).like("postal_code", `${pre}%`);
  const { count: withEmail, error: e2 } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).like("postal_code", `${pre}%`)
    .not("email", "is", null);
  if (e1 || e2) { console.log(`  Dept ${deptCode} (${label}) : ERREUR ${e1?.message || e2?.message}`); return; }
  const pct = tot ? ((withEmail!/tot!)*100).toFixed(1) : "0";
  console.log(`  Dept ${deptCode.padStart(2)} ${label.padEnd(22)} : ${String(withEmail).padStart(5)} emails / ${tot} pros = ${pct}%`);
}

async function main() {
  console.log("══ Couverture email par département (échantillon zones de demande) ══");
  await emailCov("86", "Vienne (enrichi)");
  await emailCov("40", "Landes");
  await emailCov("16", "Charente");
  await emailCov("87", "Haute-Vienne");
  await emailCov("33", "Gironde");
  await emailCov("56", "Morbihan");
  await emailCov("72", "Sarthe");
}
main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
