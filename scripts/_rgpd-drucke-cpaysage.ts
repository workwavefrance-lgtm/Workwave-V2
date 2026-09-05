/**
 * RGPD : suppression complete fiche thomas-drucke-00011 (C'Paysage)
 *
 * Demande formelle d'effacement de Thomas DRUCKE (74paysage@gmail.com,
 * SIREN 100190842, tel 06 82 80 91 86), avec piece d'identite jointe en preuve.
 * 2 emails (demande + relance) recus le 29/07/2026. Refus de figurer sur
 * Workwave => SOFT DELETE complete. Conformite RGPD art. 17.
 *
 * Meme pattern que _rgpd-durand-carrelage.ts (suppression complete, la page 404).
 *
 * Run en 2 etapes :
 *   1. AUDIT  : npx tsx scripts/_rgpd-drucke-cpaysage.ts
 *   2. APPLY  : npx tsx scripts/_rgpd-drucke-cpaysage.ts --apply
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

const SLUG = "thomas-drucke-00011";
const REQUESTER_EMAIL = "74paysage@gmail.com"; // email de la demande
const EXPECTED_SIREN = "100190842"; // garde-fou : le SIRET doit commencer par ce SIREN
const REASON = "rgpd_deletion_request_2026-07-29";
const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(`=== RGPD : suppression complete fiche ${SLUG} ===\n`);

  const { data: fiche, error } = await supabase
    .from("pros")
    .select(
      "id, slug, name, siret, phone, email, website, address, city_id, claimed_by_user_id, is_active, deleted_at, do_not_contact, source"
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
  console.log(`  source        : ${fiche.source}`);
  console.log(`  is_active     : ${fiche.is_active}`);
  console.log(`  deleted_at    : ${fiche.deleted_at}`);
  console.log(`  do_not_contact: ${fiche.do_not_contact}`);
  console.log(`  claimed       : ${fiche.claimed_by_user_id ?? "non"}`);

  // Garde-fou : le SIRET doit correspondre au SIREN de la demande.
  const siretOk = (fiche.siret || "").replace(/\D/g, "").startsWith(EXPECTED_SIREN);
  console.log(
    `\n  Garde-fou SIREN ${EXPECTED_SIREN} : ${siretOk ? "✓ correspond" : "✗ NE CORRESPOND PAS"}`
  );
  if (!siretOk) {
    console.error(
      "\n🛑 STOP : le SIRET de la fiche ne commence pas par le SIREN de la demande. Verifier manuellement avant d'appliquer."
    );
    return;
  }

  // Emails a blacklister : celui de la demande + celui stocke sur la fiche (si different).
  const emailsToBlacklist = Array.from(
    new Set([REQUESTER_EMAIL, fiche.email].filter((e): e is string => !!e))
  );

  if (!APPLY) {
    console.log("\n[DRY-RUN] Pour appliquer la suppression complete :");
    console.log("  npx tsx scripts/_rgpd-drucke-cpaysage.ts --apply");
    console.log("\nActions qui seront faites :");
    console.log(
      `  1. UPDATE pros SET deleted_at=NOW(), is_active=false, do_not_contact=true, phone=NULL, email=NULL, website=NULL WHERE slug='${SLUG}'`
    );
    console.log(
      `  2. UPSERT email_blacklist pour : ${emailsToBlacklist.join(", ")} (reason='${REASON}')`
    );
    console.log(`  3. (Ensuite) revalidate /artisan/${SLUG} + ping Indexing URL_DELETED`);
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
  console.log(
    `✓ Fiche soft-deleted (${count} ligne) : deleted_at + is_active=false + do_not_contact=true + phone/email/website nullifies`
  );

  for (const email of emailsToBlacklist) {
    const { error: blErr } = await supabase
      .from("email_blacklist")
      .upsert({ email, reason: REASON }, { onConflict: "email" });
    if (blErr) console.error(`Erreur blacklist ${email} :`, blErr.message);
    else console.log(`✓ ${email} ajoute a email_blacklist (reason=${REASON})`);
  }

  // Re-lecture pour PROUVER l'etat final (Regle 4).
  const { data: after } = await supabase
    .from("pros")
    .select("is_active, deleted_at, do_not_contact, phone, email, website")
    .eq("id", fiche.id)
    .single();
  console.log("\nEtat final verifie en base :", JSON.stringify(after));
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
