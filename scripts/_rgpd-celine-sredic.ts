/**
 * RGPD : suppression complete fiche celine-sredic-00027
 *
 * Demande formelle d'effacement de Celine SREDIC (celine.sredic@gmail.com)
 * recue le 18/05/2026. Mise en demeure formelle. Arguments :
 *   - Art. 6 et 7 RGPD (traitement sans base legale / consentement)
 *   - Utilisation non autorisee de l'identite professionnelle
 *   - Classification erronee : fiche presentee en "garde d'animaux"
 *     (categorie id 35) alors que l'activite n'est pas exercee.
 *     Cause racine : NAF 9609Z "Autres services personnels n.c.a." est
 *     un code fourre-tout INSEE classe a tort en garde-animaux par le
 *     scraping Workwave (cf. lecon CLAUDE.md 18/04 sur les NAF ambigus).
 *   - Demande de communication de la source des donnees (-> base SIRENE
 *     INSEE, donnees publiques ; a mentionner dans le mail de reponse)
 *   - Menace de saisine CNIL + procedures judiciaires
 *
 * Pattern soft delete complet identique a _rgpd-laurendeau.ts,
 * _rgpd-gary-baudy.ts, _rgpd-durand-carrelage.ts.
 *
 * Run en 2 etapes :
 *   1. AUDIT  : npx tsx scripts/_rgpd-celine-sredic.ts
 *   2. APPLY  : npx tsx scripts/_rgpd-celine-sredic.ts --apply
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

const SLUG = "celine-sredic-00027";
const EMAIL = "celine.sredic@gmail.com";
const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(`=== RGPD : suppression complete fiche ${SLUG} ===\n`);

  const { data: fiche, error } = await supabase
    .from("pros")
    .select(
      "id, slug, name, siret, naf_code, phone, email, website, address, city_id, claimed_by_user_id, is_active, deleted_at, do_not_contact"
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
  console.log(`  naf_code      : ${fiche.naf_code}`);
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
    console.log("  npx tsx scripts/_rgpd-celine-sredic.ts --apply");
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
      { email: EMAIL, reason: "rgpd_deletion_request_2026-05-18" },
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
