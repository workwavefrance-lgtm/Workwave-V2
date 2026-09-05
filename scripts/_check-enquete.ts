import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
  const { data, error } = await sb.from("pro_survey_responses")
    .select("*").order("created_at", { ascending: false }).limit(5);
  if (error) { console.error("❌", error.message); return; }
  console.log(`Réponses en base : ${data?.length || 0}\n`);
  for (const r of data || []) {
    console.log(`── ${new Date(r.created_at).toLocaleString("fr-FR")} ──`);
    console.log(`  Métier   : ${r.metier} | Taille : ${r.taille || "-"} | Dépt : ${r.departement || "-"}`);
    console.log(`  Tâches   : ${(r.taches_chrono || []).join(" · ") || "-"}`);
    console.log(`  Heures   : ${r.heures_admin || "-"} | Outils : ${r.outils_actuels || "-"}${r.outils_detail ? " ("+r.outils_detail+")" : ""}`);
    console.log(`  Corvée   : ${r.corvee_libre || "-"}`);
    console.log(`  Essayés  : ${r.outils_essayes || "-"}`);
    console.log(`  Contact  : ${r.prenom || "-"} / ${r.contact || "-"} | consent=${r.consent} | source=${r.source}`);
    console.log("");
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
