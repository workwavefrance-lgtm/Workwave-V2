/**
 * Script de rappel d'essai gratuit J13.
 *
 * Envoie un email aux pros dont l'essai se termine dans 1 jour.
 * Exécution : npx tsx scripts/send-trial-reminders.ts
 *
 * Variables d'environnement requises :
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - RESEND_API_KEY
 * - NEXT_PUBLIC_BASE_URL
 */

import { createClient } from "@supabase/supabase-js";
import { sendTrialReminderEmail } from "../lib/email/send-trial-reminder";

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Demain 00:00 et 23:59
  const now = new Date();
  const tomorrowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0
  ).toISOString();
  const tomorrowEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    23,
    59,
    59
  ).toISOString();

  // Trouver les pros en essai dont trial_ends_at est demain
  const { data: pros, error } = await supabase
    .from("pros")
    .select("id, name, email")
    .eq("subscription_status", "trialing")
    .gte("trial_ends_at", tomorrowStart)
    .lte("trial_ends_at", tomorrowEnd);

  if (error) {
    console.error("Erreur requête Supabase:", error);
    process.exit(1);
  }

  if (!pros || pros.length === 0) {
    console.log("Aucun pro avec un essai se terminant demain.");
    return;
  }

  console.log(
    `${pros.length} pro(s) avec essai se terminant demain. Envoi des emails...`
  );

  let sent = 0;
  let failed = 0;

  for (const pro of pros) {
    if (!pro.email) {
      console.warn(`Pro ${pro.id} (${pro.name}) n'a pas d'email, ignoré.`);
      continue;
    }

    try {
      await sendTrialReminderEmail(pro.email, pro.name);
      console.log(`  ✓ Email envoyé à ${pro.email} (${pro.name})`);
      sent++;
    } catch (err) {
      console.error(`  ✗ Erreur pour ${pro.email}:`, err);
      failed++;
    }
  }

  console.log(`\nTerminé. ${sent} envoyé(s), ${failed} erreur(s).`);
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});
