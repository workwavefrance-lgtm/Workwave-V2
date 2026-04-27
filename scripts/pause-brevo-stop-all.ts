/**
 * URGENCE : pause la campagne Brevo + stoppe TOUTES les sequences en cours.
 * Empêche le cron quotidien de re-déclencher des envois.
 *
 * Usage : npx tsx scripts/pause-brevo-stop-all.ts --execute
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXECUTE = process.argv.includes("--execute");

async function main() {
  console.log("============================================");
  console.log("URGENCE : pause Brevo + stop sequences");
  console.log("============================================");
  if (!EXECUTE) console.log("MODE : DRY-RUN (ajoute --execute pour appliquer)\n");

  // 1. Etat avant
  const { data: campaigns } = await supabase.from("email_campaigns").select("*");
  console.log("Campagnes en base :");
  for (const c of campaigns || []) {
    console.log(`  #${c.id} ${c.name} | status=${c.status} | daily_limit=${c.daily_limit}`);
  }

  const { count: activeSeqs } = await supabase
    .from("email_sequences")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");
  console.log(`\nSequences actives : ${activeSeqs}`);

  if (!EXECUTE) {
    console.log("\nActions qui seraient executees :");
    console.log("  1. UPDATE email_campaigns SET status='paused' WHERE status='active'");
    console.log("  2. UPDATE email_sequences SET status='paused' WHERE status='active'");
    return;
  }

  // 2. Pause campagnes actives
  console.log("\n--- EXECUTE ---");
  const { error: e1, count: c1 } = await supabase
    .from("email_campaigns")
    .update({ status: "paused" }, { count: "exact" })
    .eq("status", "active");
  if (e1) {
    console.error("Erreur pause campagnes :", e1.message);
    process.exit(1);
  }
  console.log(`Campagnes pausees : ${c1}`);

  // 3. Stop sequences actives
  const { error: e2, count: c2 } = await supabase
    .from("email_sequences")
    .update({ status: "paused" }, { count: "exact" })
    .eq("status", "active");
  if (e2) {
    console.error("Erreur pause sequences :", e2.message);
    process.exit(1);
  }
  console.log(`Sequences pausees : ${c2}`);

  // 4. Verif post
  const { data: campaignsAfter } = await supabase
    .from("email_campaigns")
    .select("id, name, status");
  console.log("\nCampagnes apres :");
  for (const c of campaignsAfter || []) {
    console.log(`  #${c.id} ${c.name} | status=${c.status}`);
  }

  console.log("\n=> Plus aucun email Brevo ne sera envoye au prochain cron (7h00).");
}

main().catch(console.error);
