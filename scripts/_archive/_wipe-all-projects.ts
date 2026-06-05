/**
 * DELETE all projects + dependent rows (project_leads, lead_unlocks).
 * User demande un wipe complet pour test propre.
 *
 * USAGE :
 *   npx tsx scripts/_wipe-all-projects.ts          # affiche le count, ne supprime rien
 *   npx tsx scripts/_wipe-all-projects.ts --apply  # supprime pour de vrai
 */
import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const APPLY = process.argv.includes("--apply");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Count before
  const { count: projectsCount } = await sb
    .from("projects")
    .select("id", { count: "exact", head: true });
  const { count: leadsCount } = await sb
    .from("project_leads")
    .select("id", { count: "exact", head: true });
  const { count: unlocksCount } = await sb
    .from("lead_unlocks")
    .select("id", { count: "exact", head: true });

  console.log(`\nÉtat actuel :`);
  console.log(`  - projects        : ${projectsCount}`);
  console.log(`  - project_leads   : ${leadsCount}`);
  console.log(`  - lead_unlocks    : ${unlocksCount}\n`);

  if (!APPLY) {
    console.log("DRY RUN. Relance avec --apply pour supprimer.\n");
    return;
  }

  console.log("=== SUPPRESSION EN COURS ===\n");

  // 1) lead_unlocks d'abord (FK vers projects)
  console.log("1. DELETE lead_unlocks...");
  const { error: e1 } = await sb
    .from("lead_unlocks")
    .delete()
    .gte("id", 0); // condition factice pour matcher tous (DELETE without WHERE = block Supabase)
  if (e1) {
    console.error("   ❌ FAIL :", e1.message);
    process.exit(1);
  }
  console.log("   ✓ OK");

  // 2) project_leads ensuite (FK vers projects)
  console.log("2. DELETE project_leads...");
  const { error: e2 } = await sb
    .from("project_leads")
    .delete()
    .gte("id", 0);
  if (e2) {
    console.error("   ❌ FAIL :", e2.message);
    process.exit(1);
  }
  console.log("   ✓ OK");

  // 3) projects (la table principale)
  console.log("3. DELETE projects...");
  const { error: e3 } = await sb
    .from("projects")
    .delete()
    .gte("id", 0);
  if (e3) {
    console.error("   ❌ FAIL :", e3.message);
    process.exit(1);
  }
  console.log("   ✓ OK");

  // Verif
  const { count: aft } = await sb
    .from("projects")
    .select("id", { count: "exact", head: true });
  console.log(`\n✓ Suppression terminée. projects restants : ${aft}`);
}

main().catch((e) => {
  console.error("\nFATAL :", e);
  process.exit(1);
});
