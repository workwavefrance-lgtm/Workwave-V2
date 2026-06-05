// Ajoute 4 métiers BTP manquants (pour les sujets "flat" du backlog prix).
// Idempotent : skip si le slug existe déjà. INSERT data (pas de DDL).
import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const NEW = [
  { slug: "traitement-nuisibles", name: "Traitement nuisibles", vertical: "domicile", naf_codes: ["8129A"], popularity: 25 },
  { slug: "ascensoriste", name: "Ascensoriste", vertical: "btp", naf_codes: ["4329B"], popularity: 18 },
  { slug: "diagnostic-immobilier", name: "Diagnostic immobilier", vertical: "btp", naf_codes: ["7120B"], popularity: 22 },
  { slug: "depannage-electromenager", name: "Dépannage électroménager", vertical: "domicile", naf_codes: ["9522Z"], popularity: 25 },
];

async function main() {
  for (const m of NEW) {
    const { data: exists } = await sb.from("categories").select("id").eq("slug", m.slug).maybeSingle();
    if (exists) { console.log(`  = ${m.slug} existe déjà (id ${exists.id})`); continue; }
    const { data, error } = await sb.from("categories").insert(m).select("id, slug").single();
    if (error) { console.error(`  ✗ ${m.slug}: ${error.message}`); continue; }
    console.log(`  ✓ ${m.slug} créé (id ${data.id}, vertical ${m.vertical})`);
  }
  const { count } = await sb.from("categories").select("id", { count: "exact", head: true }).in("vertical", ["btp", "domicile", "personne"]);
  console.log(`\nMétiers BTP/domicile/personne au total : ${count}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
