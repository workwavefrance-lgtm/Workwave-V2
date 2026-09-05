/**
 * RGPD : suppression complete fiche claire-sassella-roudil-00017
 *
 * Demande formelle d'effacement + rectification (art. 16 + 17 RGPD) de Claire
 * SASSELLA-ROUDIL (clairesassella@gmail.com), recue le 12/07/2026 sur
 * contact@workwave.fr. Personne physique (auto-entrepreneur decoratrice) → droit
 * a l'effacement. Fiche squelette Sirene (nom + SIRET + adresse, aucun tel/email).
 *
 * Pattern 2 (suppression complete, cf. _rgpd-durand-carrelage.ts) : is_active=false
 * + deleted_at + do_not_contact=true + nullify PII + blacklist email plaignante.
 * La page /artisan/[slug] retourne alors 404 (filtre is_active + deleted_at IS NULL).
 *
 *   AUDIT : npx tsx scripts/_rgpd-claire-sassella.ts
 *   APPLY : npx tsx scripts/_rgpd-claire-sassella.ts --apply
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SLUG = "claire-sassella-roudil-00017";
const EMAIL = "clairesassella@gmail.com";
const REASON = "rgpd_deletion_request_2026-07-12";
const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(`=== RGPD : suppression complete fiche ${SLUG} ===\n`);

  const { data: fiche, error } = await supabase
    .from("pros")
    .select(
      "id, slug, name, siret, phone, email, website, address, is_active, deleted_at, do_not_contact, claimed_by_user_id"
    )
    .eq("slug", SLUG)
    .single();

  if (error || !fiche) {
    console.error("Fiche introuvable :", error);
    return;
  }

  console.log("Fiche actuelle :");
  console.log(`  id            : ${fiche.id}`);
  console.log(`  name          : ${fiche.name}`);
  console.log(`  siret         : ${fiche.siret}`);
  console.log(`  is_active     : ${fiche.is_active}`);
  console.log(`  deleted_at    : ${fiche.deleted_at}`);
  console.log(`  do_not_contact: ${fiche.do_not_contact}`);
  console.log(`  claimed       : ${fiche.claimed_by_user_id ?? "non"}`);

  if (fiche.claimed_by_user_id) {
    console.error(
      "\n⛔ ATTENTION : fiche RÉCLAMÉE par un compte. Ne pas soft-delete sans vérifier l'abonnement/remboursement. ABANDON."
    );
    return;
  }

  if (!APPLY) {
    console.log("\n[DRY-RUN] Pour appliquer :");
    console.log("  npx tsx scripts/_rgpd-claire-sassella.ts --apply");
    return;
  }

  console.log("\n[APPLY] Suppression en cours...");

  const { error: updErr, count } = await supabase
    .from("pros")
    .update(
      {
        deleted_at: new Date().toISOString(),
        is_active: false,
        do_not_contact: true,
        phone: null,
        email: null,
        website: null,
      },
      { count: "exact" }
    )
    .eq("id", fiche.id);

  if (updErr) {
    console.error("Erreur update :", updErr);
    return;
  }
  console.log(`✓ Fiche soft-deleted (${count} ligne) : is_active=false + deleted_at + do_not_contact=true + PII nullifiée`);

  const { error: blErr } = await supabase
    .from("email_blacklist")
    .upsert({ email: EMAIL, reason: REASON }, { onConflict: "email" });
  if (blErr) console.error("Erreur blacklist :", blErr);
  else console.log(`✓ ${EMAIL} ajouté à email_blacklist (${REASON})`);

  // Vérif état final (ne pas se fier au log)
  const { data: check } = await supabase
    .from("pros")
    .select("is_active, deleted_at, do_not_contact")
    .eq("id", fiche.id)
    .single();
  console.log("\nVérif état final :", JSON.stringify(check));
  console.log(`\nLa page https://workwave.fr/artisan/${SLUG} doit retourner 404 après revalidate.`);
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
