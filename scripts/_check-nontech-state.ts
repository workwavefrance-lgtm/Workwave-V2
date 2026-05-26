/**
 * Verifie l'etat actuel des categories non-tech en BDD :
 *   - Combien de categories existent
 *   - Combien de pros par categorie
 *   - Statut vertical (tech / btp / autres)
 */
import { config } from "dotenv";
import * as path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("=== ETAT MULTI-VERTICAL WORKWAVE ===\n");

  // 1) Liste toutes les categories par vertical
  const { data: cats } = await sb
    .from("categories")
    .select("id, slug, name, vertical, parent_category_id")
    .order("vertical")
    .order("name");

  if (!cats) return;

  const byVertical: Record<string, typeof cats> = {};
  for (const c of cats) {
    const v = c.vertical || "(null)";
    if (!byVertical[v]) byVertical[v] = [];
    byVertical[v].push(c);
  }

  for (const [vertical, list] of Object.entries(byVertical)) {
    console.log(`\n## vertical='${vertical}' (${list.length} categories)`);
    // Top 10 par vertical
    for (const c of list.slice(0, 15)) {
      const { count } = await sb
        .from("pros")
        .select("id", { count: "estimated", head: true })
        .eq("category_id", c.id)
        .eq("is_active", true)
        .is("deleted_at", null);
      const parent = c.parent_category_id ? ` (parent:${c.parent_category_id})` : "";
      console.log(`   #${c.id.toString().padStart(4)} | ${c.slug.padEnd(30)} | ${(count || 0).toString().padStart(6)} pros | ${c.name}${parent}`);
    }
    if (list.length > 15) console.log(`   ... +${list.length - 15} autres categories`);
  }

  console.log("\n=== FIN ===\n");
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
