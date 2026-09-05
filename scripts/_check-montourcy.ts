import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
  const { data } = await sb.from("pros")
    .select("id, slug, name, siret, address, postal_code, email, phone, claimed_by_user_id, is_active, deleted_at, categories(name), cities(name, departments(code))")
    .or("name.ilike.%MONTOURCY%,name.ilike.%CM COUVERTURE%,email.ilike.%cmontourcy%").limit(10);
  console.log(`Fiches trouvées : ${data?.length || 0}\n`);
  for (const p of data || []) {
    const c = p.cities as any; const cat = (p.categories as any)?.name;
    console.log(`#${p.id} ${p.name}`);
    console.log(`  slug: ${p.slug}`);
    console.log(`  ${cat} | ${p.address || "-"} ${p.postal_code || ""} ${c?.name || ""} (${c?.departments?.code || ""})`);
    console.log(`  SIRET ${p.siret} | claimed=${p.claimed_by_user_id ? "OUI" : "non"} | active=${p.is_active} | deleted=${p.deleted_at ? "OUI" : "non"}`);
    console.log(`  URL: https://workwave.fr/artisan/${p.slug}`);
    console.log("");
  }
}
main().catch(e=>{console.error(e.message);process.exit(1);});
