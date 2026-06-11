import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // 1. ids des catégories domicile + personne
  const { data: cats } = await sb.from("categories").select("id, slug, vertical").in("vertical", ["domicile", "personne"]);
  const catIds = (cats || []).map(c => c.id);

  // 2. count total pros actifs sur ces verticaux
  const { count: total } = await sb.from("pros")
    .select("id", { count: "exact", head: true })
    .in("category_id", catIds).eq("is_active", true).is("deleted_at", null);
  console.log(`TOTAL pros domicile+personne actifs en base : ${total}`);

  // 3. répartition par préfixe postal sur les depts récents du scrape (échantillon parcours)
  const probes: [string, string][] = [
    ["44", "Loire-Atlantique (Nantes)"], ["35", "Ille-et-Vilaine (Rennes)"],
    ["29", "Finistère (Brest)"], ["56", "Morbihan"], ["22", "Côtes-d'Armor"],
    ["85", "Vendée"], ["50", "Manche"], ["14", "Calvados (Caen)"],
    ["76", "Seine-Maritime (Rouen) — EN COURS"], ["62", "Pas-de-Calais — à venir"],
    ["59", "Nord (Lille) — à venir"], ["75", "Paris — à venir"],
  ];
  for (const [prefix, label] of probes) {
    const { count } = await sb.from("pros")
      .select("id", { count: "exact", head: true })
      .in("category_id", catIds).eq("is_active", true).is("deleted_at", null)
      .like("postal_code", `${prefix}%`);
    console.log(`  ${prefix} ${label} : ${count}`);
  }

  // 4. count global toute base (suivi de la croissance)
  const { count: all } = await sb.from("pros")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null);
  console.log(`\nTOTAL GLOBAL pros actifs (tous verticaux) : ${all}`);
}
main();
