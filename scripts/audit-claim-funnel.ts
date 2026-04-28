/**
 * Audit du funnel de réclamation de fiches pro.
 *
 * Répond a la question "pourquoi les pros visitent mais ne reclament pas ?"
 * en mesurant chaque etape du funnel :
 *   1. Pros total en base (pool eligible)
 *   2. Tentatives de reclamation (table claim_attempts)
 *   3. Reclamations reussies (pros.claimed_by_user_id != null)
 *
 * Usage : npx tsx scripts/audit-claim-funnel.ts
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function pct(num: number, denom: number): string {
  if (denom === 0) return "—";
  return ((num / denom) * 100).toFixed(2) + "%";
}

async function main() {
  console.log("============================================");
  console.log("Audit funnel reclamation - Workwave");
  console.log(`Date : ${new Date().toISOString()}`);
  console.log("============================================\n");

  // === DETAIL des fiches reclamees ===
  console.log("=== DETAIL DES FICHES RECLAMEES (qui sont ces pros ?) ===");
  const { data: claimedPros } = await supabase
    .from("pros")
    .select(
      "id, slug, name, email, claimed_at, claimed_by_user_id, subscription_status, subscription_plan, trial_ends_at"
    )
    .not("claimed_by_user_id", "is", null)
    .order("claimed_at", { ascending: false });

  if (claimedPros && claimedPros.length > 0) {
    for (const p of claimedPros) {
      console.log(
        `  [${p.id}] ${p.name?.slice(0, 35).padEnd(35)} | email: ${p.email ?? "—"} | claimed_at: ${p.claimed_at ?? "—"} | sub: ${p.subscription_status ?? "—"}`
      );
    }
  } else {
    console.log("  (aucune)");
  }

  // === DETAIL des tentatives de reclamation ===
  console.log("\n=== DETAIL TENTATIVES (claim_attempts) ===");
  try {
    const { data: attempts } = await supabase
      .from("claim_attempts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (attempts && attempts.length > 0) {
      for (const a of attempts) {
        console.log(
          `  ${a.created_at?.slice(0, 19) ?? "—"} | siret: ${a.siret ?? "—"} | email: ${a.email ?? "—"} | success: ${a.success} | ${a.error_reason ?? ""}`
        );
      }
    } else {
      console.log("  (aucune)");
    }
  } catch (e) {
    console.log("  (table claim_attempts indisponible)");
  }

  // === COMPTAGES GLOBAUX ===
  console.log("\n=== COMPTAGES GLOBAUX ===");
  const { count: prosTotal } = await supabase
    .from("pros")
    .select("id", { count: "exact", head: true });

  const { count: prosWithEmail } = await supabase
    .from("pros")
    .select("id", { count: "exact", head: true })
    .not("email", "is", null)
    .neq("email", "");

  console.log(`  Pros total en base       : ${prosTotal?.toLocaleString("fr") ?? 0}`);
  console.log(`  Pros avec email valide   : ${prosWithEmail?.toLocaleString("fr") ?? 0}`);
  console.log(`  Pros reclames            : ${claimedPros?.length ?? 0}`);
  console.log(`    → taux                 : ${pct(claimedPros?.length ?? 0, prosTotal ?? 0)}`);
  console.log();
}

main().catch((err) => {
  console.error("Erreur :", err);
  process.exit(1);
});
