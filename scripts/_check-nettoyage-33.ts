import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
  // Trouver la catégorie "nettoyage vitres"
  const { data: cats } = await sb.from("categories").select("id, name, slug").or("slug.ilike.%vitr%,name.ilike.%vitr%,slug.ilike.%nettoyage%");
  console.log("Catégories candidates :", (cats||[]).map(c => `#${c.id} ${c.name} (${c.slug})`).join(" | "));
  const cat = (cats||[]).find(c => /vitr/i.test(c.slug) || /vitr/i.test(c.name));
  if (!cat) { console.log("Pas de catégorie nettoyage vitres trouvée."); return; }
  console.log(`\n→ Catégorie retenue : #${cat.id} ${cat.name}\n`);
  // Pros dept 33
  const { data } = await sb.from("pros")
    .select("id, name, postal_code, email, phone, website, instagram, cities(name)")
    .eq("category_id", cat.id).eq("is_active", true).is("deleted_at", null)
    .like("postal_code", "33%").limit(40);
  const rows = data || [];
  const withC = rows.filter(p => p.email || p.phone || p.website || p.instagram);
  console.log(`Pros "${cat.name}" en Gironde (33) : ${rows.length}, dont ${withC.length} avec contact.\n`);
  for (const p of rows) {
    const c = (p.cities as any)?.name || "?";
    const bits = [p.instagram&&`IG:${p.instagram}`, p.website&&`web:${p.website}`, p.email&&`mail:${p.email}`, p.phone&&`tel:${p.phone}`].filter(Boolean).join(" ");
    console.log(`  ${(p.postal_code||"").padEnd(6)} ${(p.name||"").slice(0,34).padEnd(34)} ${c.padEnd(22)} ${bits||"(squelette)"}`);
  }
}
main().catch(e=>{console.error(e.message);process.exit(1);});
