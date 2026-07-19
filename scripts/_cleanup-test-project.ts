import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const ID = parseInt(process.argv[2] || "0", 10);

(async () => {
  if (!ID) { console.log("Usage: npx tsx scripts/_cleanup-test-project.ts <projectId>"); process.exit(1); }

  const { data: before } = await sb.from("projects").select("id, first_name, email, description").eq("id", ID).maybeSingle();
  if (!before) { console.log(`Projet #${ID} deja absent.`); process.exit(0); }
  const b = before as any;
  console.log(`Projet a supprimer : #${b.id} | ${b.first_name} | ${b.email}`);
  if (!/TEST/i.test(b.first_name || "") && !/TEST/i.test(b.description || "")) {
    console.log("❌ SECURITE : ce projet ne ressemble pas a un test (pas de 'TEST'). Abandon.");
    process.exit(1);
  }

  // Enfants d'abord (FK). Lecon 08/06 : TOUJOURS verifier l'erreur d'un delete.
  for (const table of ["events", "project_leads", "lead_unlocks"]) {
    const { error, count } = await sb.from(table).delete({ count: "exact" }).eq("project_id", ID);
    if (error) { console.log(`❌ ${table} : ${error.message}`); process.exit(1); }
    console.log(`  ${table.padEnd(14)} : ${count ?? 0} ligne(s) supprimee(s)`);
  }

  const { error: delErr, count } = await sb.from("projects").delete({ count: "exact" }).eq("id", ID);
  if (delErr) { console.log("❌ suppression projet :", delErr.message); process.exit(1); }
  console.log(`  projects       : ${count ?? 0} ligne(s) supprimee(s)`);

  // VERIFICATION reelle en base (ne jamais se fier au log du script)
  const { data: after } = await sb.from("projects").select("id").eq("id", ID).maybeSingle();
  const { data: evAfter } = await sb.from("events").select("id").eq("project_id", ID);
  if (after) { console.log(`\n❌ ECHEC : le projet #${ID} est TOUJOURS en base.`); process.exit(1); }
  console.log(`\n✅ VERIFIE : projet #${ID} absent de la base, ${(evAfter||[]).length} event(s) residuel(s).`);
})();
