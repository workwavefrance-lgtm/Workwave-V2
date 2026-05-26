/**
 * Liste les categories macro non-tech (slugs cibles du seed).
 * Verifie qu'elles existent bien en BDD avec leur ID et vertical.
 */
import { config } from "dotenv";
import * as path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const TARGET_SLUGS = [
  "marketing-communication",
  "strategie-management",
  "design-creation",
  "finance-comptabilite",
  "juridique-conseil",
  "rh-recrutement",
  "redaction-copywriting",
  "audiovisuel-medias",
];

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("\n=== Categories macro non-tech ===\n");
  for (const slug of TARGET_SLUGS) {
    const { data } = await sb
      .from("categories")
      .select("id, slug, name, vertical, parent_category_id")
      .eq("slug", slug)
      .maybeSingle();
    if (data) {
      const { count } = await sb
        .from("pros")
        .select("id", { count: "estimated", head: true })
        .eq("category_id", data.id);
      console.log(
        `   ✓ ${slug.padEnd(28)} | id=${data.id} | vertical=${data.vertical} | parent=${data.parent_category_id || "-"} | ${count} pros`
      );
    } else {
      console.log(`   ✗ ${slug.padEnd(28)} | MANQUANTE — a creer en BDD`);
    }
  }
  console.log("");
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
