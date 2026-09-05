import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // retrouver les rows arrondissements Lyon par nom
  const { data: arr } = await sb.from("cities").select("id, name, slug")
    .or("name.ilike.%lyon%arrondissement%,slug.like.lyon-%-arrondissement%,name.ilike.lyon %e%");
  const lyonArr = (arr || []).filter(c => /lyon.*(arrond|[0-9]+e)/i.test(c.name) || /^lyon-\d/.test(c.slug));
  console.log(`Rows arrondissements Lyon trouvées : ${lyonArr.length}`);
  for (const c of lyonArr) {
    const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("city_id", c.id).eq("is_active", true).is("deleted_at", null);
    if ((count || 0) > 0) console.log(`  ⚠ ${c.name} (${c.id}) : ${count} pros`);
  }
  const totalArr = lyonArr.length;
  if (totalArr === 0) console.log("(aucune row arrondissement, rien à vérifier)");

  // count sur la commune Lyon (id 16720 d'après la leçon du 11/06)
  const { count: lyonCount } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("city_id", 16720).eq("is_active", true).is("deleted_at", null);
  console.log(`Pros sur la COMMUNE Lyon (id 16720) : ${lyonCount}`);
}
main();
