import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const ids = [78, 72];
  const { data, error, count } = await sb.from("projects")
    .update({ status: "deleted" }, { count: "exact" })
    .in("id", ids).select("id");
  if (error) { console.error("❌ ERREUR update:", error.message); process.exit(1); }
  console.log(`Update OK : ${count} ligne(s) modifiée(s) : ${(data||[]).map(d=>"#"+d.id).join(", ")}`);
  // Re-vérification en base (ne jamais se fier au seul retour)
  const { data: check } = await sb.from("projects").select("id, status, first_name").in("id", ids);
  console.log("\nVérification :");
  for (const p of check || []) console.log(`  #${p.id} (${p.first_name}) -> status = ${p.status}`);
  // Confirme que #64 (vrai projet) est INTACT
  const { data: real } = await sb.from("projects").select("id, status, description").eq("id", 64).single();
  console.log(`\n#64 (vrai projet électricien) toujours intact : status=${real?.status} ✓`);
}
main().catch(e => { console.error(e.message); process.exit(1); });
