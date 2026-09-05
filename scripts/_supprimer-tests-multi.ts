import { config } from "dotenv"; import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const IDS = [214, 215, 216];
(async () => {
  for (const ID of IDS) {
    // Garde : on relit la ligne et on verifie un SECOND champ avant d'ecrire.
    const { data: p } = await sb.from("projects").select("id,description").eq("id", ID).maybeSingle();
    if (!p || !p.description?.startsWith("TEST TECHNIQUE WORKWAVE")) {
      console.log(`ARRET : #${ID} n'est pas un projet de test.`); process.exit(1);
    }
    for (const t of ["events", "project_leads", "lead_unlocks"]) {
      const { error, count } = await sb.from(t).delete({ count: "exact" }).eq("project_id", ID);
      if (error) { console.log(`  #${ID} ${t} ERREUR ${error.message}`); process.exit(1); }
      if (count) console.log(`  #${ID} ${t} : ${count} supprime(s)`);
    }
    const { error } = await sb.from("projects").delete().eq("id", ID);
    console.log(`  #${ID} : ${error ? "ERREUR " + error.message : "supprime"}`);
    if (error) process.exit(1);
  }
  // Verification finale EN BASE, pas sur le log.
  const { data: reste } = await sb.from("projects").select("id").in("id", IDS);
  const { data: restL } = await sb.from("project_leads").select("id").in("project_id", IDS);
  console.log(`\nVERIFICATION : ${reste?.length ?? 0} projet(s) restant(s) · ${restL?.length ?? 0} lead(s) restant(s)`);
})();
