/**
 * Migration : ajoute les champs Google Places sur la table pros.
 *
 * Champs ajoutes :
 *   - google_place_id        : ID Google Place (pour re-enrichissement futur + dedup)
 *   - google_rating          : note moyenne 0-5 (pour schema aggregateRating)
 *   - google_reviews_count   : nombre d'avis Google (pour schema aggregateRating)
 *   - google_enriched_at     : timestamp du dernier enrichissement
 *
 * Usage : npx tsx scripts/migrate-add-google-places-fields.ts
 */
import { config } from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Migration : ajoute champs Google Places sur 'pros'...\n");

  const sql = `
    ALTER TABLE pros
      ADD COLUMN IF NOT EXISTS google_place_id text,
      ADD COLUMN IF NOT EXISTS google_rating numeric(2, 1),
      ADD COLUMN IF NOT EXISTS google_reviews_count integer,
      ADD COLUMN IF NOT EXISTS google_enriched_at timestamptz;

    CREATE INDEX IF NOT EXISTS idx_pros_google_place_id ON pros(google_place_id) WHERE google_place_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_pros_google_enriched_at ON pros(google_enriched_at) WHERE google_enriched_at IS NOT NULL;
  `;

  // Supabase JS n'expose pas DDL direct : utiliser RPC custom OU passer par le SQL Editor.
  // On passe par la fonction RPC standard `exec_sql` si dispo, sinon affiche le SQL pour copier.
  const { error } = await supabase.rpc("exec_sql" as any, { sql });

  if (error) {
    console.log(
      "\x1b[33m[ATTENTION]\x1b[0m La fonction RPC 'exec_sql' n'existe pas (normal en setup standard)."
    );
    console.log("\nCopie-colle ce SQL dans le SQL Editor de Supabase :");
    console.log("─".repeat(70));
    console.log(sql.trim());
    console.log("─".repeat(70));
    console.log(
      "\nDashboard Supabase -> SQL Editor -> New query -> coller -> Run\n"
    );
    return;
  }

  console.log("\x1b[32m✅ Migration appliquée avec succès\x1b[0m");

  // Verif
  const { data } = await supabase.from("pros").select("google_place_id, google_rating, google_reviews_count, google_enriched_at").limit(1);
  console.log("Champs verifies :", data ? Object.keys(data[0] || {}) : "ERREUR");
}

main().catch((e) => { console.error(e); process.exit(1); });
