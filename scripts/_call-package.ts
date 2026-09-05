import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const proIds = [4047, 4393, 4215688];
  console.log("══ PROS À APPELER ══");
  for (const id of proIds) {
    const { data: p } = await sb.from("pros").select("id, name, phone, email, slug").eq("id", id).single();
    console.log(`  #${p?.id} ${p?.name}  ☎ ${p?.phone || "-"}  ✉ ${p?.email || "-"}`);
  }
  console.log("\n══ CE QUE VEULENT LES CLIENTS ══");
  for (const pid of [75, 74, 71]) {
    const { data: pr } = await sb.from("projects")
      .select("id, first_name, phone, email, description, budget_estimated, urgency, created_at, categories(name), cities(name, postal_code, departments(code))")
      .eq("id", pid).single();
    const c = pr?.cities as { name?: string; postal_code?: string; departments?: { code?: string } } | null;
    const cat = (pr?.categories as { name?: string } | null)?.name;
    console.log(`\n  Projet #${pr?.id} · ${cat} @ ${c?.name} (${c?.postal_code})`);
    console.log(`    Client : ${pr?.first_name} | urgence: ${pr?.urgency || "-"} | budget: ${pr?.budget_estimated || "-"}`);
    console.log(`    Besoin : ${(pr?.description || "").slice(0, 300)}`);
  }
}
main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
