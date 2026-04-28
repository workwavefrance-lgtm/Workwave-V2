/**
 * Envoie une notif admin retroactive pour chaque fiche reclamee
 * dont l'admin n'a jamais ete notifie (bug fixe le 28/04/2026).
 *
 * Filtre :
 *   - claimed_by_user_id != null
 *   - claimed_at posterieur a une date butoir (par defaut 2026-04-12 pour
 *     exclure le test ATSAF du 11/04)
 *
 * Usage :
 *   npx tsx scripts/notify-past-claims.ts                 # dry-run
 *   npx tsx scripts/notify-past-claims.ts --execute       # envoie pour de vrai
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";
import { sendClaimSuccessAlert } from "@/lib/email/send-verification-code";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXECUTE = process.argv.includes("--execute");
// Par defaut on exclut tout ce qui est avant le 12/04 pour eviter de re-notifier le test ATSAF
const SINCE = process.env.SINCE ?? "2026-04-12T00:00:00Z";

type ClaimedRow = {
  id: number;
  slug: string;
  name: string;
  siret: string | null;
  email: string | null;
  claimed_at: string | null;
  cities: { name: string } | { name: string }[] | null;
  categories: { name: string } | { name: string }[] | null;
};

function pickName(v: ClaimedRow["cities"] | ClaimedRow["categories"]): string | null {
  if (!v) return null;
  if (Array.isArray(v)) return v[0]?.name ?? null;
  return v.name ?? null;
}

async function main() {
  console.log("============================================");
  console.log("Notif admin retroactive : fiches reclamees");
  console.log(`Cutoff (claimed_at >=) : ${SINCE}`);
  console.log("============================================");
  if (!EXECUTE) console.log("MODE : DRY-RUN (ajoute --execute pour envoyer)\n");

  const { data, error } = await supabase
    .from("pros")
    .select(
      "id, slug, name, siret, email, claimed_at, cities(name), categories(name)"
    )
    .not("claimed_by_user_id", "is", null)
    .gte("claimed_at", SINCE)
    .order("claimed_at", { ascending: true });

  if (error) {
    console.error("Erreur SELECT :", error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as ClaimedRow[];
  console.log(`Fiches a notifier : ${rows.length}\n`);

  if (rows.length === 0) {
    console.log("(rien a faire)");
    return;
  }

  for (const p of rows) {
    const city = pickName(p.cities);
    const cat = pickName(p.categories);
    const line = `  [${p.id}] ${p.name?.padEnd(35).slice(0, 35)} | ${cat ?? "—"} | ${city ?? "—"} | claimed_at=${p.claimed_at?.slice(0, 19)}`;

    if (!EXECUTE) {
      console.log(line + "  [DRY-RUN]");
      continue;
    }

    try {
      await sendClaimSuccessAlert({
        proId: p.id,
        proName: p.name,
        proSlug: p.slug,
        proSiret: p.siret,
        proCity: city,
        proCategory: cat,
        claimEmail: p.email ?? "—",
      });
      console.log(line + "  ✅ envoye");
    } catch (e) {
      console.log(line + `  ❌ ${(e as Error).message}`);
    }
  }

  console.log("\n=== DONE ===");
}

main().catch((err) => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});
