import { config } from "dotenv"; import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const IDS = [214, 215, 216];
(async () => {
 for (const ID of IDS) {
  // Garde de securite : on relit la ligne et on verifie qu'un SECOND champ
  // concorde avant de supprimer (lecon du 06/08 : un script destructif qui
  // "devine" finira par deviner faux).
  const { data: p } = await sb.from("projects").select("id,description,email").eq("id", ID).maybeSingle();
  if (!p || !p.description?.includes("TEST TECHNIQUE WORKWAVE")) {
    console.log("ARRET : le projet", ID, "n'est pas le projet de test attendu."); process.exit(1);
  }
  console.log(`cible confirmee : #${p.id} (${p.email})`);

  // Ordre impose par les cles etrangeres : events, project_leads, lead_unlocks,
  // PUIS le projet. Chaque erreur est verifiee (lecon du 08/06 : un DELETE qui
  // viole une FK renvoie { error } SANS lever d'exception).
  for (const t of ["events", "project_leads", "lead_unlocks"]) {
    const { error, count } = await sb.from(t).delete({ count: "exact" }).eq("project_id", ID);
    console.log(`  ${t} : ${error ? "ERREUR " + error.message : count + " supprime(s)"}`);
    if (error) process.exit(1);
  }
  const { error, count } = await sb.from("projects").delete({ count: "exact" }).eq("id", ID);
  console.log(`  projects : ${error ? "ERREUR " + error.message : count + " supprime(s)"}`);
  if (error) process.exit(1);

  // Verification finale EN BASE, pas sur le log du script.
  const { data: reste } = await sb.from("projects").select("id").eq("id", ID);
  const { data: restL } = await sb.from("project_leads").select("id").eq("project_id", ID);
  console.log(`\nVERIFICATION : projet ${reste?.length ? "TOUJOURS PRESENT" : "absent"} · leads restants ${restL?.length ?? 0}`);
})();
