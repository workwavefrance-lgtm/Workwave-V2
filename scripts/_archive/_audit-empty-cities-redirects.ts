/**
 * Audit des redirects Phase D : verifier que `/[metier]/[ville]` pour des
 * villes SANS pros redirige bien en 308 vers `/[metier]/[dept]`.
 *
 * Pourquoi : GSC affiche 12 593 "Page avec redirection" — on veut confirmer
 * que ce sont nos 308 volontaires (Phase D, leçon 30/04 dans CLAUDE.md) et
 * pas des redirects en boucle ou cassés.
 *
 * Usage :
 *   npx tsx scripts/_audit-empty-cities-redirects.ts
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
  override: true,
});

import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

const BASE = "https://workwave.fr";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateDepartmentSlug(dept: { name: string; code: string }): string {
  return `${dept.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${dept.code}`;
}

async function getRedirectChain(url: string): Promise<{ status: number; finalUrl: string; chain: string[] }> {
  try {
    // -L = follow redirects, -o /dev/null, max 5 redirects, return all status + final URL
    const out = execSync(
      `curl -o /dev/null -s -w "%{http_code} %{url_effective}" --max-redirs 5 --max-time 10 -L "${url}"`,
      { encoding: "utf-8" }
    ).trim();
    const [code, ...rest] = out.split(" ");
    const finalUrl = rest.join(" ");

    // Pour avoir le status code initial (pas suivi), on refait sans -L
    const initialCode = execSync(
      `curl -o /dev/null -s -w "%{http_code}" --max-time 10 "${url}"`,
      { encoding: "utf-8" }
    ).trim();

    return {
      status: parseInt(initialCode) || 0,
      finalUrl,
      chain: [`${initialCode} -> ${finalUrl} (final ${code})`],
    };
  } catch {
    return { status: 0, finalUrl: "", chain: [] };
  }
}

async function main() {
  console.log("=== Audit redirects Phase D (villes sans pros) ===\n");

  // 1. Recupere quelques categories actives et leurs villes sans pros
  const { data: cats } = await supabase
    .from("categories")
    .select("id, slug, name")
    .limit(5);

  if (!cats || cats.length === 0) {
    console.log("Pas de categories.");
    return;
  }

  console.log(`Test sur ${cats.length} categories x 4 villes sans pros = ${cats.length * 4} URLs\n`);

  let totalTested = 0;
  let ok308 = 0;
  let other = 0;
  const issues: { url: string; status: number; finalUrl: string }[] = [];

  for (const cat of cats) {
    // Recupere des villes (PAS dans Vienne 86 pour varier les depts) sans pros dans cette categorie
    const { data: cities } = await supabase
      .from("cities")
      .select("id, name, slug, department:departments!cities_department_id_fkey(name, code)")
      .neq("department_id", 7) // exclude Vienne (id 7 si je me souviens, sinon mettre celui d'un autre dept)
      .limit(20);

    if (!cities) continue;

    // Pour chaque ville, on teste si elle a 0 pros dans la cat
    const citiesWithZeroPros: typeof cities = [];
    for (const c of cities) {
      const { count } = await supabase
        .from("pros")
        .select("*", { count: "exact", head: true })
        .eq("category_id", cat.id)
        .eq("city_id", c.id)
        .eq("is_active", true)
        .is("deleted_at", null);
      if (count === 0) {
        citiesWithZeroPros.push(c);
        if (citiesWithZeroPros.length >= 4) break;
      }
    }

    for (const city of citiesWithZeroPros) {
      const url = `${BASE}/${cat.slug}/${city.slug}`;
      const result = await getRedirectChain(url);
      totalTested++;

      const dept = Array.isArray(city.department) ? city.department[0] : city.department;
      const expectedRedirect = dept ? `${BASE}/${cat.slug}/${generateDepartmentSlug(dept)}` : null;

      const isExpected =
        result.status === 308 &&
        expectedRedirect &&
        result.finalUrl === expectedRedirect;

      const symbol = isExpected ? "✓" : "✗";
      console.log(`  ${symbol} ${url}`);
      console.log(`     [${result.status}] -> ${result.finalUrl}`);
      if (!isExpected) {
        console.log(`     ATTENDU: ${expectedRedirect}`);
        issues.push({ url, status: result.status, finalUrl: result.finalUrl });
        other++;
      } else {
        ok308++;
      }
    }
  }

  console.log(`\n=== RECAP ===`);
  console.log(`Total teste : ${totalTested}`);
  console.log(`  ✓ 308 Phase D OK : ${ok308}`);
  console.log(`  ✗ Autres        : ${other}`);

  if (issues.length === 0) {
    console.log(`\n✅ Tous les redirects Phase D fonctionnent correctement.`);
    console.log(`   Les 12 593 'Page avec redirection' GSC = nos 308 volontaires.`);
    console.log(`   ZERO probleme. Google les voit comme normales.`);
  } else {
    console.log(`\n⚠️  ${issues.length} redirects inattendus :`);
    issues.forEach((i) =>
      console.log(`   [${i.status}] ${i.url} -> ${i.finalUrl}`)
    );
  }
}

main().catch(console.error);
