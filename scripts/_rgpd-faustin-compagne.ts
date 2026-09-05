/**
 * RGPD : suppression complete fiche Faustin COMPAGNE
 *
 * Demande formelle d'effacement (faustin.compagne@gmail.com, recu 18/07/2026
 * via contact@workwave.fr). Fiche creee sans intervention du pro, refus de
 * figurer + opposition (art. 15/17/21 RGPD) => SOFT DELETE complete.
 *
 *   1. AUDIT : npx tsx scripts/_rgpd-faustin-compagne.ts
 *   2. APPLY : npx tsx scripts/_rgpd-faustin-compagne.ts --apply
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SLUG = "faustin-compagne-00015";
const EMAIL = "faustin.compagne@gmail.com";
const REASON = "rgpd_deletion_request_2026-07-18";
const APPLY = process.argv.includes("--apply");

async function main() {
  console.log(`=== RGPD : recherche fiche ${SLUG} ===\n`);

  const { data: bySlug } = await supabase
    .from("pros")
    .select("id, slug, name, siret, phone, email, website, address, city_id, categories(name), claimed_by_user_id, is_active, deleted_at, do_not_contact")
    .eq("slug", SLUG);

  const fiches = bySlug || [];
  if (fiches.length === 0) {
    console.log("Aucune fiche trouvee pour " + SLUG);
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
    console.log("[DRY-RUN] Pour supprimer la fiche ci-dessus :");
    console.log("  npx tsx scripts/_rgpd-faustin-compagne.ts --apply");
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
