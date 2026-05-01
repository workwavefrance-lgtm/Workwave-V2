/**
 * RGPD : suppression coordonnees melangees sur la fiche miroiterie-melusine-00028
 *
 * Plainte 30/04/2026 de Manon BERNARD (labalademelusine@gmail.com) :
 * son tel, mail, site (labalademelusine.fr) apparaissent sur la fiche
 * MIROITERIE MELUSINE alors qu'elle dirige une entreprise distincte
 * (La balade Melusine - petsitting). Erreur enrichissement Apify probable.
 *
 * Run en 2 etapes :
 *   1. AUDIT  : npx tsx scripts/_rgpd-miroiterie-melusine.ts
 *   2. APPLY  : npx tsx scripts/_rgpd-miroiterie-melusine.ts --apply
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

const APPLY = process.argv.includes("--apply");

async function main() {
  console.log("=== RGPD : fiche miroiterie-melusine-00028 ===\n");

  // 1. Lire la fiche
  const { data: fiche, error } = await supabase
    .from("pros")
    .select("id, slug, name, siret, phone, email, website, address, city_id, claimed_by_user_id")
    .eq("slug", "miroiterie-melusine-00028")
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
  console.log(`  claimed       : ${fiche.claimed_by_user_id ?? "non"}`);

  // 2. Verifier si une fiche La balade Melusine existe en base
  console.log("\nRecherche autre fiche avec coordonnees Manon :");
  const { data: matches } = await supabase
    .from("pros")
    .select("id, slug, name, phone, email, website")
    .or(
      "phone.like.%0664714846%,email.eq.labalademelusine@gmail.com,website.like.%labalademelusine%"
    )
    .limit(10);

  if (matches && matches.length > 0) {
    for (const m of matches) {
      console.log(`  - ${m.slug} (${m.name}) [phone=${m.phone}, email=${m.email}, website=${m.website}]`);
    }
  } else {
    console.log("  Aucune autre fiche trouvee.");
  }

  // 3. Action
  if (!APPLY) {
    console.log("\n[DRY-RUN] Pour appliquer la suppression :");
    console.log("  npx tsx scripts/_rgpd-miroiterie-melusine.ts --apply");
    console.log("\nSeront nullifies sur miroiterie-melusine-00028 :");
    console.log(`  phone   : ${fiche.phone} -> NULL`);
    console.log(`  email   : ${fiche.email} -> NULL`);
    console.log(`  website : ${fiche.website} -> NULL`);
    console.log("\n(Le SIRET, nom commercial et adresse RESTENT, c'est la fiche legale de l'entreprise MIROITERIE MELUSINE qui existe vraiment.)");
    return;
  }

  console.log("\n[APPLY] Suppression en cours...");
  const { error: updErr } = await supabase
    .from("pros")
    .update({
      phone: null,
      email: null,
      website: null,
    })
    .eq("id", fiche.id);

  if (updErr) {
    console.error("Erreur update :", updErr);
    return;
  }

  console.log("✓ phone, email, website nullifies sur la fiche.");
  console.log("\n[Optionnel] Re-ping Indexing API pour forcer Google a re-crawler :");
  console.log(`  https://workwave.fr/artisan/${fiche.slug}`);
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
