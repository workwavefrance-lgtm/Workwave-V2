/**
 * Generation SEO IA pour les pages categorie x departement sur la
 * Nouvelle-Aquitaine (Phase E expansion NA).
 *
 * Cible : 38 cat actives x les departements cibles (cf. TARGET_DEPT_CODES).
 * Skip automatique si la page existe deja en base + si 0 pro dans le dept.
 *
 * Cout estime : ~$0.028 par page (Claude Sonnet 4.6). 28 depts des 4 nouvelles
 * regions x 38 cat, moins les skips 0-pro ~ $25-30.
 *
 * Usage :
 *   npx tsx scripts/generate-seo-na-departments.ts --dry-run
 *   npx tsx scripts/generate-seo-na-departments.ts                       # tous les nouveaux dpts
 *   npx tsx scripts/generate-seo-na-departments.ts --departement 23      # un seul dpt
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
});

import { createClient } from "@supabase/supabase-js";
import { generateSeoContent } from "../lib/ai/generate-seo";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Departements des 4 nouvelles regions (Bretagne, Pays de la Loire, Occitanie,
// PACA). La Nouvelle-Aquitaine (12 depts, dont Vienne) est deja generee — skip
// auto via existingSlugs si jamais on les remet ici.
const TARGET_DEPT_CODES = [
  // Bretagne
  "22", "29", "35", "56",
  // Pays de la Loire
  "44", "49", "53", "72", "85",
  // Occitanie
  "09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82",
  // Provence-Alpes-Cote d'Azur
  "04", "05", "06", "13", "83", "84",
];

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const deptArgIdx = args.indexOf("--departement");
const FILTER_DEPT =
  deptArgIdx >= 0 && args[deptArgIdx + 1] ? args[deptArgIdx + 1] : null;

const DELAY_MS = 1000; // 1s entre les calls Claude (rate limit)

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function countProsInDept(categoryId: number, deptId: number): Promise<number> {
  // Lookup city_ids du dept (paginated jusqu'a 1000)
  const cityIds: number[] = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from("cities")
      .select("id")
      .eq("department_id", deptId)
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    for (const c of data) cityIds.push(c.id as number);
    if (data.length < 1000) break;
    offset += 1000;
  }
  if (cityIds.length === 0) return 0;

  // Count pros - paginer la liste in() par batch de 500
  let prosCount = 0;
  for (let i = 0; i < cityIds.length; i += 500) {
    const batch = cityIds.slice(i, i + 500);
    const { count } = await supabase
      .from("pros")
      .select("id", { count: "exact", head: true })
      .eq("category_id", categoryId)
      .in("city_id", batch);
    prosCount += count || 0;
  }
  return prosCount;
}

function deptSlugFromCode(name: string, code: string): string {
  return `${name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${code}`;
}

async function main() {
  console.log("============================================");
  console.log("Phase E : SEO IA pour cat x dept Nouvelle-Aquitaine");
  console.log("============================================");
  if (DRY_RUN) console.log("MODE : DRY-RUN");
  if (FILTER_DEPT) console.log(`FILTRE : departement ${FILTER_DEPT} uniquement`);

  // 1. Charger categories
  // IMPORTANT : ne garder que les verticaux BTP/domicile/personne (38 cat).
  // Les 145 cat "tech" (Workwave AI / international) vivent sur /ai et /en/ai,
  // PAS sur les pages BTP /[metier]/[dept] — il ne faut surtout pas générer
  // de contenu dépt pour elles (junk + coût ×5).
  const { data: catsRaw } = await supabase
    .from("categories")
    .select("id, slug, name")
    .in("vertical", ["btp", "domicile", "personne"])
    .order("name");
  const categories = (catsRaw || []) as Array<{
    id: number;
    slug: string;
    name: string;
  }>;
  console.log(`\nCategories actives : ${categories.length}`);

  // 2. Charger les dpts cibles
  const targets = FILTER_DEPT ? [FILTER_DEPT] : TARGET_DEPT_CODES;
  const { data: deptsRaw } = await supabase
    .from("departments")
    .select("id, code, name")
    .in("code", targets);
  const depts = (deptsRaw || []) as Array<{ id: number; code: string; name: string }>;
  console.log(`Departements cibles : ${depts.length}`);
  console.log(`  ->`, depts.map((d) => `${d.code}`).join(", "));

  // 3. Lister tous les slugs deja en base (paginer)
  const existingSlugs = new Set<string>();
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from("seo_pages")
      .select("slug")
      .like("slug", "%-%/%-%")
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    for (const r of data) existingSlugs.add(r.slug as string);
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log(`Pages SEO deja en base : ${existingSlugs.size}`);

  // 4. Calcul total + skip
  const totalCombinations = categories.length * depts.length;
  const toGenerate: Array<{
    cat: { id: number; slug: string; name: string };
    dept: { id: number; code: string; name: string };
    slug: string;
  }> = [];
  let skipped = 0;
  for (const cat of categories) {
    for (const dept of depts) {
      const slug = `${cat.slug}/${deptSlugFromCode(dept.name, dept.code)}`;
      if (existingSlugs.has(slug)) {
        skipped++;
        continue;
      }
      toGenerate.push({ cat, dept, slug });
    }
  }

  console.log(`\nTotal combinaisons : ${totalCombinations}`);
  console.log(`Deja generees      : ${skipped}`);
  console.log(`A generer          : ${toGenerate.length}`);
  console.log(`Cout estime        : $${(toGenerate.length * 0.028).toFixed(2)}`);

  if (DRY_RUN) {
    console.log("\n[DRY RUN] Stop here.");
    if (toGenerate.length > 0) {
      console.log("\nPremiers 5 a generer :");
      toGenerate.slice(0, 5).forEach((t) => {
        console.log(`  - ${t.slug} (cat=${t.cat.name}, dept=${t.dept.code})`);
      });
    }
    return;
  }

  // 5. Generation
  let generated = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < toGenerate.length; i++) {
    const { cat, dept, slug } = toGenerate[i];
    const progress = `[${i + 1}/${toGenerate.length}]`;

    try {
      const prosCount = await countProsInDept(cat.id, dept.id);
      if (prosCount === 0) {
        console.log(`${progress} SKIP ${slug} (0 pros)`);
        continue;
      }

      console.log(`${progress} GENERATING ${slug} (${prosCount} pros)...`);

      const result = await generateSeoContent({
        categoryName: cat.name,
        categorySlug: cat.slug,
        locationName: dept.name,
        locationSlug: deptSlugFromCode(dept.name, dept.code),
        locationType: "department",
        departmentName: dept.name,
        departmentCode: dept.code,
        prosCount,
      });

      const { error } = await supabase.from("seo_pages").insert({
        slug,
        type: "metier_dept",
        category_id: cat.id,
        department_id: dept.id,
        city_id: null,
        title: result.title,
        meta_description: result.metaDescription,
        content: result.content,
      });

      if (error) {
        console.log(`  ERROR insert : ${error.message}`);
        failed++;
      } else {
        generated++;
      }
    } catch (e) {
      console.log(`  FAIL : ${(e as Error).message}`);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n============================================`);
  console.log(`Termine en ${elapsed} min`);
  console.log(`Generees : ${generated}`);
  console.log(`Echecs   : ${failed}`);
  console.log(`Cout reel approx : $${(generated * 0.028).toFixed(2)}`);
}

main().catch((err) => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});
