import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Les pros qui ont reçu un lead précis (project_leads) = les plus chauds à convertir
  const { data: pls } = await sb.from("project_leads")
    .select("id, project_id, pro_id, status, sent_at, opened_at, contacted_at")
    .order("sent_at", { ascending: false });
  console.log(`══ project_leads (${pls?.length}) · pros ayant reçu un lead précis ══\n`);
  for (const pl of pls || []) {
    const { data: pro } = await sb.from("pros").select("name, email, phone, claimed_by_user_id, category_id").eq("id", pl.pro_id).single();
    const { data: proj } = await sb.from("projects").select("first_name, status, broadcast_count, created_at, categories(name), cities(name, departments(code))").eq("id", pl.project_id).single();
    const c = proj?.cities as { name?: string; departments?: { code?: string } } | null;
    const cat = (proj?.categories as { name?: string } | null)?.name;
    const unlocked = await sb.from("lead_unlocks").select("id", { count: "exact", head: true }).eq("project_id", pl.project_id).eq("pro_id", pl.pro_id);
    const age = Math.floor((Date.now() - new Date(proj?.created_at || pl.sent_at).getTime()) / 86400e3);
    console.log(`  Lead #${pl.project_id} ${cat} @ ${c?.name} (${c?.departments?.code}) J-${age}`);
    console.log(`    → Pro #${pl.pro_id} ${pro?.name}  | claimed=${pro?.claimed_by_user_id ? "OUI ✓" : "non"} | email=${pro?.email ? "oui" : "-"} | tel=${pro?.phone ? "oui" : "-"}`);
    console.log(`    → lead vu=${pl.opened_at ? "oui" : "non"} | contacté=${pl.contacted_at ? "oui" : "non"} | A PAYÉ=${(unlocked.count||0) > 0 ? "💰 OUI" : "non"}`);
    console.log("");
  }

  // Total des unlocks payés
  const { data: u } = await sb.from("lead_unlocks").select("project_id, pro_id, amount_cents, created_at");
  console.log(`══ Paiements réels (lead_unlocks) : ${u?.length} ══`);
  for (const x of u || []) console.log(`  projet #${x.project_id} ← pro #${x.pro_id} : ${(x.amount_cents/100).toFixed(2)}€ (${x.created_at?.slice(0,10)})`);
}
main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
