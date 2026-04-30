/**
 * Pre-flight batch3/4/5 (30/04/2026 soir).
 *
 * 1. Reset VALENTIN LIGAUD (debug test du sender → s'etait blacklist sans le vouloir)
 * 2. Recupere la blacklist actuelle (pros.do_not_contact + pros.email_bounced + email_blacklist)
 * 3. Ecrase les 3 .brevo-cold-batchN-sent.json avec ces emails
 *    -> les batches existants skip ces emails au moment de l'envoi (idempotence)
 *    -> on respecte donc les desinscriptions et bounces sans toucher au code des batches
 *
 * Run: npx tsx scripts/_prepare-batches-tonight.ts
 */
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
});

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("=== Prepare batches tonight ===\n");

  // 1. Reset VALENTIN LIGAUD
  const valentinEmail = "valentinligaud@gmail.com";
  console.log("[1/3] Reset VALENTIN LIGAUD...");
  const { error: e1 } = await supabase
    .from("pros")
    .update({ do_not_contact: false, email_bounced: false })
    .eq("email", valentinEmail);
  if (e1) console.log("  ⚠️ pros update :", e1.message);
  const { error: e2 } = await supabase
    .from("email_blacklist")
    .delete()
    .eq("email", valentinEmail);
  if (e2) console.log("  ⚠️ blacklist delete :", e2.message);
  console.log("  VALENTIN remis dans la liste\n");

  // 2. Pull blacklist
  console.log("[2/3] Recup blacklist...");
  const { data: doNotContact } = await supabase
    .from("pros")
    .select("email")
    .eq("do_not_contact", true)
    .not("email", "is", null);
  const { data: bounced } = await supabase
    .from("pros")
    .select("email")
    .eq("email_bounced", true)
    .not("email", "is", null);
  const { data: explicitBlacklist } = await supabase
    .from("email_blacklist")
    .select("email");

  const blacklistSet = new Set<string>();
  for (const p of doNotContact || []) if (p.email) blacklistSet.add(p.email);
  for (const p of bounced || []) if (p.email) blacklistSet.add(p.email);
  for (const p of explicitBlacklist || []) if (p.email) blacklistSet.add(p.email);

  console.log(`  do_not_contact   : ${doNotContact?.length ?? 0}`);
  console.log(`  email_bounced    : ${bounced?.length ?? 0}`);
  console.log(`  email_blacklist  : ${explicitBlacklist?.length ?? 0}`);
  console.log(`  Total unique     : ${blacklistSet.size}\n`);

  // 3. Write .json tracking pour batch3, batch4, batch5
  console.log("[3/3] Ecrase les .json tracking...");
  const arr = [...blacklistSet];
  for (const f of ["batch3", "batch4", "batch5"]) {
    const p = path.resolve(
      process.cwd(),
      `scripts/.brevo-cold-${f}-sent.json`
    );
    fs.writeFileSync(p, JSON.stringify(arr, null, 2));
    console.log(`  ✓ ${path.basename(p)} : ${arr.length} emails skip`);
  }

  console.log("\n=== DONE ===");
  console.log("Tu peux maintenant lancer les 3 batches :");
  console.log("  npx tsx scripts/brevo-cold-batch3.ts --execute");
  console.log("  npx tsx scripts/brevo-cold-batch4.ts --execute");
  console.log("  npx tsx scripts/brevo-cold-batch5.ts --execute");
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
