/**
 * RGPD : suppression complete fiche marilyne-laurendeau-00020
 *
 * Demande formelle d'effacement de Marilyne LAURENDEAU
 * (mlaurendeau980@gmail.com) recue le 12/05/2026 a 23h57.
 * Arguments :
 *   - Art. 17 RGPD (droit a l'effacement)
 *   - SIRET 88025535100020 indique radie (mais etat_admin = "A" en base Sirene v3 :
 *     on accepte sa parole, on supprime quoi qu'il en soit)
 *   - Bouton "Supprimer ma fiche" du site signale comme inoperant
 *     (a investiguer apres : possible bug du flow /artisan/[slug]/supprimer)
 *   - Menace de saisine CNIL en cas de non-reponse
 *
 * Pattern soft delete complet identique a _rgpd-durand-carrelage.ts
 * et _rgpd-gary-baudy.ts.
 *
 * Run en 2 etapes :
 *   1. AUDIT  : npx tsx scripts/_rgpd-laurendeau.ts
 *   2. APPLY  : npx tsx scripts/_rgpd-laurendeau.ts --apply
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

const SLUG = "marilyne-laurendeau-00020";
const EMAIL = "mlaurendeau980@gmail.com";
const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(`=== RGPD : suppression complete fiche ${SLUG} ===\n`);

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
    console.log("\n[DRY-RUN] Pour appliquer la suppression :");
    console.log("  npx tsx scripts/_rgpd-laurendeau.ts --apply");
    return;
  }

  console.log("\n[APPLY] Suppression en cours...");

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
  console.log("✓ Fiche soft-deleted (deleted_at + is_active=false + do_not_contact=true + PII nullifies)");

  const { error: blErr } = await supabase
    .from("email_blacklist")
    .upsert(
      { email: EMAIL, reason: "rgpd_deletion_request_2026-05-13" },
      { onConflict: "email" }
    );
  if (blErr) {
    console.error("Erreur blacklist :", blErr);
  } else {
    console.log(`✓ ${EMAIL} ajoute a email_blacklist`);
  }

  console.log("\nVerification :");
  console.log(`  curl -o /dev/null -w "%{http_code}\\n" https://workwave.fr/artisan/${SLUG}`);
  console.log(`  -> doit retourner 404 (apres revalidate)`);
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
