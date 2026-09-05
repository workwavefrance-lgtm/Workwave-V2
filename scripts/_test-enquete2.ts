import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = createClient(URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const service = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // INSERT PUR (exactement comme le formulaire : pas de .select())
  const { error: e1 } = await anon.from("pro_survey_responses").insert({
    metier: "Plombier",
    taille: "Seul",
    departement: "86",
    taches_chrono: ["Faire les devis", "Relancer les clients / devis non signés"],
    heures_admin: "5 à 10h",
    corvee_libre: "LIGNE DE TEST CLAUDE · à supprimer",
    outils_actuels: "Excel",
    consent: false,
    source: "test-claude",
  });
  console.log(e1 ? `❌ INSERT anon pur: ${e1.message}` : `✓ INSERT anon PUR OK (= chemin du formulaire)`);

  // Lecture service pour confirmer + récupérer l'id, puis cleanup
  const { data } = await service.from("pro_survey_responses")
    .select("id, metier, taches_chrono").eq("source", "test-claude");
  console.log(`✓ Lecture service : ${data?.length || 0} ligne(s) de test trouvée(s)`);
  if (data?.length) {
    await service.from("pro_survey_responses").delete().eq("source", "test-claude");
    console.log(`✓ Lignes de test supprimées`);
  }
}
main().catch(e => { console.error(e.message); process.exit(1); });
