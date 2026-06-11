/**
 * RGPD : suppression complete fiche yvonne-tonges-00013 (Yvonne Tonges)
 *
 * Demande formelle d'effacement de Yvonne TONGES (yvonne.carola@orange.fr)
 * suite au cold email du 01/05/2026. Refus explicite de figurer sur Workwave +
 * menace de blocage. Conformite RGPD art. 17 + L34-5 CPCE.
 *
 * Difference vs _rgpd-miroiterie-melusine.ts :
 *   - Manon : coordonnees melangees par Apify, on nullifie phone/email/website
 *     mais la fiche legale MIROITERIE MELUSINE reste (autre entreprise reelle).
 *   - Freddy : refus de figurer => SOFT DELETE complete (is_active=false +
 *     deleted_at + nullify PII + do_not_contact=true). La page retourne 404.
 *
 * Run en 2 etapes :
 *   1. AUDIT  : npx tsx scripts/_rgpd-yvonne-tonges.ts
 *   2. APPLY  : npx tsx scripts/_rgpd-yvonne-tonges.ts --apply
 */
import path from "path";
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

const SLUG = "yvonne-tonges-00013";
const EMAIL = "yvonne.carola@orange.fr";
const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(`=== RGPD : suppression complete fiche ${SLUG} ===\n`);

  // 1. Lire la fiche
  const { data: fiche, error } = await supabase
    .from("pros")
    .select(
      "id, slug, name, siret, phone, email, website, address, city_id, claimed_by_user_id, is_active, deleted_at, do_not_contact"
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
  console.log(`  phone         : ${fiche.phone}`);
  console.log(`  email         : ${fiche.email}`);
  console.log(`  website       : ${fiche.website}`);
  console.log(`  address       : ${fiche.address}`);
  console.log(`  is_active     : ${fiche.is_active}`);
  console.log(`  deleted_at    : ${fiche.deleted_at}`);
  console.log(`  do_not_contact: ${fiche.do_not_contact}`);
  console.log(`  claimed       : ${fiche.claimed_by_user_id ?? "non"}`);

  if (!APPLY) {
    console.log("\n[DRY-RUN] Pour appliquer la suppression complete :");
    console.log("  npx tsx scripts/_rgpd-yvonne-tonges.ts --apply");
    console.log("\nActions :");
    console.log(`  1. UPDATE pros SET deleted_at=NOW(), is_active=false, do_not_contact=true,`);
    console.log(`     phone=NULL, email=NULL, website=NULL WHERE slug='${SLUG}'`);
    console.log(`  2. UPSERT email_blacklist (email='${EMAIL}', reason='rgpd_deletion_request_2026-06-11')`);
    console.log(`  3. (Manuel) re-ping Indexing API en URL_REMOVED pour deindex Google`);
    return;
  }

  console.log("\n[APPLY] Suppression en cours...");

  // 2. Soft delete la fiche + nullify PII
  const { error: updErr } = await supabase
    .from("pros")
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
      do_not_contact: true,
      phone: null,
      email: null,
      website: null,
    })
    .eq("id", fiche.id);

  if (updErr) {
    console.error("Erreur update :", updErr);
    return;
  }
  console.log("✓ Fiche soft-deleted (deleted_at + is_active=false + do_not_contact=true + phone/email/website nullifies)");

  // 3. Ajouter a email_blacklist
  const { error: blErr } = await supabase
    .from("email_blacklist")
    .upsert(
      { email: EMAIL, reason: "rgpd_deletion_request_2026-06-11" },
      { onConflict: "email" }
    );
  if (blErr) {
    console.error("Erreur blacklist :", blErr);
  } else {
    console.log(`✓ ${EMAIL} ajoute a email_blacklist (reason=rgpd_deletion_request_2026-06-11)`);
  }

  console.log("\nVerification :");
  console.log(`  curl -o /dev/null -w "%{http_code}\\n" https://workwave.fr/artisan/${SLUG}`);
  console.log(`  -> doit retourner 404 (apres revalidate)`);
  console.log("\n[Optionnel] Re-ping Google Indexing API en URL_REMOVED :");
  console.log(`  https://workwave.fr/artisan/${SLUG}`);
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
