/**
 * Génère lib/data/metier-stats.ts : le nombre RÉEL de pros actifs par métier
 * (depuis notre base de 2,4M fiches) + la couverture globale.
 *
 * Donnée 100% réelle, unique (aucun concurrent n'a ce dataset), ISR-safe
 * (statique, lue au rendu sans requête). À relancer après chaque gros scrape.
 *
 * Usage : npx tsx scripts/build-metier-stats.ts
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

import { createClient } from "@supabase/supabase-js";
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: cats, error: catErr } = await sb
    .from("categories")
    .select("id,slug")
    .in("vertical", ["btp", "domicile", "personne"])
    .order("slug");
  if (catErr || !cats) throw catErr;

  // Couverture globale (petites tables → count exact instantané)
  const { count: deptCount } = await sb
    .from("departments")
    .select("id", { count: "exact", head: true });
  const { count: cityCount } = await sb
    .from("cities")
    .select("id", { count: "exact", head: true });

  const stats: Record<string, number> = {};
  for (const c of cats) {
    const { count } = await sb
      .from("pros")
      .select("id", { count: "exact", head: true })
      .eq("category_id", c.id)
      .eq("is_active", true)
      .is("deleted_at", null);
    stats[c.slug] = count || 0;
    console.log(`  ${c.slug.padEnd(28)} ${count}`);
  }

  const retrievedAt = new Date().toISOString().slice(0, 10);
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  const file =
    `// Stats RÉELLES par métier (nombre de pros actifs) issues de notre base.\n` +
    `// Généré le ${retrievedAt} — relancer \`npx tsx scripts/build-metier-stats.ts\` après un scrape.\n` +
    `// Donnée unique (dataset propriétaire) — 0 invention.\n\n` +
    `export const METIER_STATS: Record<string, number> = ${JSON.stringify(stats, null, 2)};\n\n` +
    `export const COVERAGE = {\n` +
    `  departments: ${deptCount || 0},\n` +
    `  communes: ${cityCount || 0},\n` +
    `  totalPros: ${total},\n` +
    `  retrievedAt: ${JSON.stringify(retrievedAt)},\n` +
    `};\n`;
  const dest = path.resolve(process.cwd(), "lib/data/metier-stats.ts");
  fs.writeFileSync(dest, file);
  console.log(
    `\n📝 ${dest}\n   ${cats.length} métiers · ${total.toLocaleString("fr-FR")} pros · ${deptCount} dépts · ${cityCount} communes`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
