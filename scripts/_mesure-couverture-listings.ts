/**
 * Combien de pages metier x ville EXISTENT reellement (au moins 1 pro ouvert),
 * contre combien le sitemap en declare. Mesure sur TOUTES les communes, pas
 * seulement les 300 plus peuplees.
 */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const villes: number[] = [];
  for (let offset = 0; ; ) {
    const { data, error } = await sb.from("cities").select("id").order("id").range(offset, offset + 999);
    if (error) { console.error("cities:", error.message); process.exit(1); }
    const rows = data || []; if (!rows.length) break;
    villes.push(...rows.map((r) => r.id)); offset += rows.length;
  }
  console.log(`communes en base : ${villes.length}`);
  let combos1 = 0, combos3 = 0, erreurs = 0;
  const parVille = new Map<number, number>();
  for (let i = 0; i < villes.length; i += 300) {
    const lot = villes.slice(i, i + 300);
    const { data, error } = await sb.rpc("sitemap_city_cat_counts", { p_city_ids: lot });
    if (error) { erreurs++; continue; }
    for (const r of (data || []) as { c: number; v: number; n: number }[]) {
      combos3++; parVille.set(r.v, (parVille.get(r.v) || 0) + 1);
    }
    if (i % 3000 === 0) console.log(`  ${i}/${villes.length} communes parcourues, ${combos3} combos >= 3 pros`);
  }
  console.log(`\nRESULTAT`);
  console.log(`  combinaisons metier x ville avec >= 3 pros OUVERTS, toutes communes : ${combos3}`);
  console.log(`  communes concernees : ${parVille.size}`);
  console.log(`  lots en erreur : ${erreurs}`);
  console.log(`  le sitemap en declare aujourd hui : 8 235 (top 300 villes seulement)`);
  console.log(`  ecart : ${combos3 - 8235} pages qui existent et ne sont pas annoncees a Google`);
})();
