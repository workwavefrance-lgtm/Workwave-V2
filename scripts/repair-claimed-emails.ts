/** Lecture seule par défaut. --apply ne remplit que les emails manquants,
 * après concordance compte confirmé / réclamation vérifiée / fiche propriétaire.
 * Ne réactive aucun opt-out et n'envoie aucun email. Ne journalise pas d'adresse.
 */
import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { normalizeEmail } from "../lib/pro/ownership";

async function main() {
  const apply = process.argv.includes("--apply");
  const env = { ...parse(readFileSync(".env.local")), ...process.env };
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: pros, error } = await db.from("pros")
    .select("id, siret, claimed_by_user_id")
    .not("claimed_by_user_id", "is", null).is("email", null).is("deleted_at", null)
    .eq("is_active", true).eq("do_not_contact", false)
    .not("id", "in", "(4393,99999,1432477)").order("id").limit(1000);
  if (error) throw new Error(`Lecture des fiches impossible (${error.code})`);
  if (pros?.length === 1000) throw new Error("Lot trop grand : paginer avant toute application.");
  let eligible = 0, updated = 0, skipped = 0;
  for (const pro of pros ?? []) {
    const { data: { user }, error: authError } = await db.auth.admin.getUserById(pro.claimed_by_user_id);
    if (authError) throw new Error(`Lecture du compte impossible (fiche ${pro.id})`);
    const email = normalizeEmail(user?.email);
    if (!user?.email_confirmed_at || !email || !pro.siret) { skipped++; continue; }
    const { data: attempts, error: attemptError } = await db.from("claim_attempts")
      .select("id, email").eq("siret", pro.siret).eq("success", true).eq("status", "verified")
      .eq("type", "claim").ilike("email", email.replace(/[\\%_]/g, "\\$&")).limit(100);
    if (attemptError) throw new Error(`Lecture des preuves impossible (${attemptError.code})`);
    if (!attempts?.some((a) => normalizeEmail(a.email) === email)) { skipped++; continue; }
    eligible++;
    if (apply) {
      const { data: changed, error: updateError } = await db.from("pros").update({ email })
        .eq("id", pro.id).eq("claimed_by_user_id", user.id).eq("siret", pro.siret)
        .is("email", null).is("deleted_at", null).eq("is_active", true).eq("do_not_contact", false)
        .select("id");
      if (updateError) throw new Error(`Mise à jour impossible (${updateError.code})`);
      updated += changed?.length ?? 0;
    }
  }
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", checked: pros?.length ?? 0, eligible, skipped, updated }));
}
main().catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
