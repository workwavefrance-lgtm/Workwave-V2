/**
 * Audit du volume d'URLs noindex sur le site (lecture seule).
 *
 * Sources de noindex :
 *  1. /[metier]/[ville]                     -> noindex si prosCount === 0
 *  2. /[metier]/[specialite]/[ville]        -> noindex si prosCount === 0
 *  3. /artisan/[slug]                       -> noindex si pas de contenu
 *
 * Objectif : valider que les ~8140 URLs noindex remontées par GSC viennent
 * bien de ces sources, et déterminer la stratégie de réduction.
 *
 * Usage : npx tsx scripts/audit-noindex-volume.ts
 */
import { config } from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { SPECIALTIES } from "../lib/specialties";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("\n=== AUDIT NOINDEX VOLUME ===\n");

  // 1. Charger toutes les catégories
  const { data: categories } = await supabase.from("categories").select("id, slug, name");
  if (!categories) return;
  console.log(`Catégories actives : ${categories.length}`);

  // 2. Charger toutes les villes Vienne
  const { data: cities } = await supabase
    .from("cities")
    .select("id, slug, name")
    .order("slug");
  if (!cities) return;
  console.log(`Villes Vienne     : ${cities.length}`);

  // 3. Compter les pros par couple (catégorie × ville) — paginé
  console.log("\nChargement pros par couple (catégorie × ville)...");
  let allRows: { category_id: number; city_id: number }[] = [];
  let offset = 0;
  const PAGE = 1000;
  while (true) {
    const { data } = await supabase
      .from("pros")
      .select("category_id, city_id")
      .eq("is_active", true)
      .is("deleted_at", null)
      .range(offset, offset + PAGE - 1);
    if (!data || data.length === 0) break;
    allRows = allRows.concat(data as typeof allRows);
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  console.log(`  ${allRows.length} pros chargés (par city_id, après cleanup)`);

  // Index par couple
  const couples = new Set<string>();
  for (const row of allRows) {
    couples.add(`${row.category_id}-${row.city_id}`);
  }
  console.log(`  Couples uniques (cat × ville) avec >= 1 pro : ${couples.size}`);

  // 4. Calcul théorique
  const theoreticalCouples = categories.length * cities.length;
  const couplesWithoutPros = theoreticalCouples - couples.size;
  console.log(`\n--- /[metier]/[ville] ---`);
  console.log(`  Théorique : ${categories.length} cat × ${cities.length} villes = ${theoreticalCouples}`);
  console.log(`  Avec >= 1 pro : ${couples.size} (page indexable normale)`);
  console.log(`  Avec 0 pro    : ${couplesWithoutPros} (NOINDEX actuellement)`);

  // 5. Sous-spécialités : pour les métiers qui ont des spécialités
  const specialtyMetiers = Object.keys(SPECIALTIES);
  let totalSpecialtyPages = 0;
  let noindexSpecialty = 0;
  for (const metierSlug of specialtyMetiers) {
    const cat = categories.find((c) => c.slug === metierSlug);
    if (!cat) continue;
    const specs = SPECIALTIES[metierSlug];
    if (!specs) continue;
    for (const spec of specs) {
      for (const city of cities) {
        totalSpecialtyPages++;
        const hasPros = couples.has(`${cat.id}-${city.id}`);
        if (!hasPros) noindexSpecialty++;
      }
    }
  }
  console.log(`\n--- /[metier]/[specialite]/[ville] ---`);
  console.log(`  Métiers avec spécialités : ${specialtyMetiers.length}`);
  console.log(`  Total combinaisons : ${totalSpecialtyPages}`);
  console.log(`  NOINDEX (0 pro)    : ${noindexSpecialty}`);
  console.log(`  Indexables         : ${totalSpecialtyPages - noindexSpecialty}`);

  // Note : le sitemap ne génère que les couples top 10 villes × spécialité × cat avec >= 1 pro.
  // Donc Google peut quand même découvrir les autres via maillage interne.

  // 6. Fiches /artisan/[slug] sans contenu
  console.log(`\n--- /artisan/[slug] ---`);
  const { count: prosTotal } = await supabase
    .from("pros")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .is("deleted_at", null);
  console.log(`  Total pros actifs : ${prosTotal}`);

  // sans contenu = pas claimed, pas description, pas phone
  const { count: prosNoContent } = await supabase
    .from("pros")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .is("deleted_at", null)
    .is("claimed_by_user_id", null)
    .is("description", null)
    .is("phone", null);
  console.log(`  Sans contenu (NOINDEX) : ${prosNoContent}`);
  console.log(`  Avec contenu           : ${(prosTotal || 0) - (prosNoContent || 0)}`);

  // 7. Total noindex potentiels
  const totalNoindex = couplesWithoutPros + noindexSpecialty + (prosNoContent || 0);
  console.log(`\n=== TOTAL NOINDEX POTENTIELS ===`);
  console.log(`  /[metier]/[ville]                 : ${couplesWithoutPros}`);
  console.log(`  /[metier]/[specialite]/[ville]    : ${noindexSpecialty}`);
  console.log(`  /artisan/[slug] sans contenu      : ${prosNoContent}`);
  console.log(`  TOTAL                             : ${totalNoindex}`);
  console.log(`\n  GSC affiche : ~8140 URLs noindex`);
  console.log();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
