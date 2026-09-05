import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = createClient(URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const service = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // 1. INSERT via la clé ANON (= le formulaire public)
  const { data: ins, error: e1 } = await anon.from("pro_survey_responses").insert({
    metier: "Plombier",
    taille: "Seul",
    departement: "86",
    taches_chrono: ["Faire les devis", "Relancer les clients / devis non signés"],
    heures_admin: "5 à 10h",
    corvee_libre: "LIGNE DE TEST CLAUDE · à supprimer",
    outils_actuels: "Excel",
    consent: false,
    source: "test-claude",
  }).select("id").single();
  console.log(e1 ? `❌ INSERT anon: ${e1.message}` : `✓ INSERT anon OK (id ${ins?.id})`);
  if (e1) process.exit(1);
  const id = ins!.id;

  // 2. L'anon NE DOIT PAS pouvoir lire (RLS select bloqué)
  const { data: rAnon } = await anon.from("pro_survey_responses").select("id").eq("id", id);
  console.log(`✓ Lecture anon : ${rAnon?.length ? "⚠️ LISIBLE (problème RLS!)" : "0 ligne (bloqué = correct)"}`);

  // 3. Le service (= admin) DOIT pouvoir lire
  const { data: rSvc } = await service.from("pro_survey_responses").select("metier, taches_chrono, source").eq("id", id).single();
  console.log(`✓ Lecture service (admin) : ${rSvc ? `OK · ${rSvc.metier}, [${(rSvc.taches_chrono||[]).join(", ")}]` : "❌ rien"}`);

  // 4. Nettoyage de la ligne de test
  const { error: e4 } = await service.from("pro_survey_responses").delete().eq("id", id);
  console.log(e4 ? `⚠️ cleanup: ${e4.message}` : `✓ Ligne de test supprimée`);
}
main().catch(e => { console.error(e.message); process.exit(1); });
