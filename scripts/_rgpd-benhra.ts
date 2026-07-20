/**
 * RGPD : suppression complete fiche(s) Mohcine BENHRA / BENHRA Mohcine
 *
 * Demande formelle d'effacement (mohcinebenhra@gmail.com, recu 16/07/2026 via
 * contact@workwave.fr). Entreprise individuelle "livraison de courses", fermee
 * depuis 2010. Refus de figurer => SOFT DELETE complete (art. 17 RGPD).
 *
 *   1. AUDIT : npx tsx scripts/_rgpd-benhra.ts
 *   2. APPLY : npx tsx scripts/_rgpd-benhra.ts --apply
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EMAIL = "mohcinebenhra@gmail.com";
const REASON = "rgpd_deletion_request_2026-07-16";
const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(`=== RGPD : recherche fiche(s) BENHRA / MOHCINE ===\n`);

  // Cible UNIQUE : la fiche exacte du plaignant (Mohcine BENHRA, livraison de
  // courses, SIRET 49166852100025). Recherche large "%MOHCINE%" ecartee : elle
  // matchait 42 homonymes sans lien avec la demande. On ne supprime QUE lui.
  const TARGET_IDS = [4108563];
  const { data: byId } = await supabase
    .from("pros")
    .select("id, slug, name, siret, phone, email, website, address, city_id, categories(name), claimed_by_user_id, is_active, deleted_at, do_not_contact")
    .in("id", TARGET_IDS);

  const fiches = byId || [];
  if (fiches.length === 0) {
    console.log("Aucune fiche trouvee pour BENHRA / MOHCINE / " + EMAIL);
    return;
  }

  console.log(`${fiches.length} fiche(s) trouvee(s) :\n`);
  for (const f of fiches) {
    console.log(`  id=${f.id}  slug=${f.slug}`);
    console.log(`    name    : ${f.name}`);
    console.log(`    metier  : ${(f as any).categories?.name ?? "?"}`);
    console.log(`    siret   : ${f.siret}`);
    console.log(`    phone   : ${f.phone ?? "-"}   email: ${f.email ?? "-"}   web: ${f.website ?? "-"}`);
    console.log(`    active  : ${f.is_active}   deleted_at: ${f.deleted_at ?? "non"}   claimed: ${f.claimed_by_user_id ?? "non"}`);
    console.log("");
  }

  if (!APPLY) {
    console.log("[DRY-RUN] Pour supprimer TOUTES les fiches ci-dessus :");
    console.log("  npx tsx scripts/_rgpd-benhra.ts --apply");
    return;
  }

  console.log("[APPLY] Suppression complete en cours...\n");
  for (const f of fiches) {
    const { error: updErr } = await supabase
      .from("pros")
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        do_not_contact: true,
        phone: null,
        email: null,
        website: null,
        // ── Ajout du 20/07/2026 ──────────────────────────────────────────
        // La 1re passe (16/07) neutralisait la fiche mais LAISSAIT le nom et
        // l'adresse en base. Or c'est précisément ce que le plaignant demande
        // d'effacer ("supprimer de vos données mon nom et prénom"), d'où sa
        // relance et sa menace de plainte. On anonymise donc pour de bon.
        //
        // La LIGNE est conservée (avec son SIRET) et sert de pierre tombale :
        // le scraper SIRENE insère en `on_conflict=siret, ignore_duplicates`,
        // donc supprimer la ligne ferait RECRÉER la fiche au prochain passage
        // et republierait la personne — pire que de n'avoir rien fait. On
        // garde le strict minimum technique qui rend l'effacement durable.
        name: "Fiche supprimée à la demande du titulaire",
        address: null,
        postal_code: null,
        description: null,
        logo_url: null,
        photos: [],
      })
      .eq("id", f.id);
    if (updErr) { console.error(`✗ id=${f.id} :`, updErr.message); continue; }
    console.log(`✓ id=${f.id} (${f.slug}) soft-deleted + PII nullifiee`);
  }

  const { error: blErr } = await supabase
    .from("email_blacklist")
    .upsert({ email: EMAIL, reason: REASON }, { onConflict: "email" });
  console.log(blErr ? `✗ blacklist : ${blErr.message}` : `✓ ${EMAIL} ajoute a email_blacklist`);

  console.log("\nVerification (apres revalidate) :");
  for (const f of fiches) {
    console.log(`  curl -o /dev/null -w "%{http_code}\\n" https://workwave.fr/artisan/${f.slug}  -> 404`);
  }
}

main().catch((e) => { console.error("Erreur :", e); process.exit(1); });
