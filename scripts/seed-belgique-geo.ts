/**
 * Seed géographique Belgique v1 : 6 provinces + 271 communes francophones.
 *
 * Source : scraping/data/be_communes.json (généré le 11/07/2026 depuis
 * Statbel georef 2025 + bpost codes postaux + Statbel population 01/01/2025).
 * Périmètre : Wallonie francophone (252, dont Malmedy/Waimes et les 4 communes
 * à facilités NL) + Bruxelles-Capitale (19). Exclus : Flandre + 9 germanophones.
 *
 * PRÉREQUIS : migration migrations/2026-07-11_belgique_v1_geo.sql appliquée
 * (colonnes country). Le script refuse de tourner sinon.
 *
 * Idempotent : provinces upsert par (code, country) ; communes skip si
 * (country='BE', insee_code=NIS) existe déjà. Slugs collision-aware vs les
 * villes françaises : suffixe "-be" si le slug est déjà pris (ex. Mons FR
 * existe → la commune belge devient mons-be).
 *
 * Usage :
 *   npx tsx scripts/seed-belgique-geo.ts --dry-run   # audit sans écriture
 *   npx tsx scripts/seed-belgique-geo.ts             # seed réel
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const DRY = process.argv.includes("--dry-run");

type BeCommune = {
  nis: string;
  name: string;
  slug: string;
  dept: string;
  postal_code: string;
  all_postcodes: string[];
  lat: number;
  lng: number;
  population: number;
};

// Provinces wallonnes + Bruxelles-Capitale. Codes alpha 3 lettres (dérivés
// ISO 3166-2:BE) : IMPOSSIBLE de collisionner avec les codes départements
// français (tous numériques sauf 2A/2B). Stockés en MAJUSCULES comme la Corse
// ("2A") : getDepartmentBySlug fait parsed.code.toUpperCase() pour le lookup,
// et generateDepartmentSlug fait code.toLowerCase() pour le slug → "hainaut-wht".
const PROVINCES = [
  { code: "BRU", name: "Bruxelles-Capitale", region: "Bruxelles-Capitale" },
  { code: "WHT", name: "Hainaut", region: "Wallonie" },
  { code: "WLG", name: "Liège", region: "Wallonie" },
  { code: "WNA", name: "Namur", region: "Wallonie" },
  { code: "WBR", name: "Brabant wallon", region: "Wallonie" },
  { code: "WLX", name: "Luxembourg belge", region: "Wallonie" },
];

async function main() {
  console.log(`\n════ SEED BELGIQUE ${DRY ? "(DRY-RUN)" : "(RÉEL)"} ════\n`);

  // ── 0. Prérequis : la colonne country doit exister ──
  const { error: colErr } = await sb.from("cities").select("country").limit(1);
  if (colErr) {
    console.error(
      "🔴 La colonne cities.country n'existe pas encore.\n" +
        "   Applique d'abord migrations/2026-07-11_belgique_v1_geo.sql dans le SQL Editor.\n" +
        `   (erreur: ${colErr.message})`
    );
    process.exit(1);
  }

  const communes: BeCommune[] = JSON.parse(
    fs.readFileSync(path.resolve("scraping/data/be_communes.json"), "utf8")
  );
  console.log(`Communes cibles : ${communes.length}`);

  // ── 1. Provinces (departments) ──
  // Map keyé en minuscules : be_communes.json référence les provinces en
  // minuscules ("dept": "wht") alors que la BDD stocke "WHT".
  const deptIdByCode = new Map<string, number>();
  for (const p of PROVINCES) {
    const key = p.code.toLowerCase();
    const { data: existing } = await sb
      .from("departments")
      .select("id, name")
      .eq("code", p.code)
      .eq("country", "BE")
      .maybeSingle();
    if (existing) {
      deptIdByCode.set(key, existing.id);
      console.log(`  = province ${p.name} (${p.code}) existe déjà (id ${existing.id})`);
      continue;
    }
    if (DRY) {
      console.log(`  + [dry] créerait province ${p.name} (${p.code})`);
      deptIdByCode.set(key, -1);
      continue;
    }
    const { data: created, error } = await sb
      .from("departments")
      .insert({ code: p.code, name: p.name, region: p.region, country: "BE" })
      .select("id")
      .single();
    if (error || !created) {
      console.error(`🔴 échec création province ${p.code}:`, error?.message);
      process.exit(1);
    }
    deptIdByCode.set(key, created.id);
    console.log(`  ✓ province ${p.name} (${p.code}) créée (id ${created.id})`);
  }

  // ── 2. Communes existantes BE (idempotence par NIS) ──
  const existingByNis = new Map<string, number>();
  {
    const PAGE = 1000;
    let offset = 0;
    while (true) {
      const { data } = await sb
        .from("cities")
        .select("id, insee_code")
        .eq("country", "BE")
        .range(offset, offset + PAGE - 1);
      const rows = data || [];
      if (rows.length === 0) break;
      rows.forEach((r) => r.insee_code && existingByNis.set(r.insee_code, r.id));
      offset += rows.length;
    }
  }
  console.log(`\nCommunes BE déjà en base : ${existingByNis.size}`);

  // ── 3. Insert communes, slug collision-aware ──
  let created = 0,
    skipped = 0,
    suffixed = 0;
  for (const c of communes) {
    if (existingByNis.has(c.nis)) {
      skipped++;
      continue;
    }
    const deptId = deptIdByCode.get(c.dept);
    if (!deptId) {
      console.error(`🔴 province inconnue ${c.dept} pour ${c.name}`);
      continue;
    }

    // Collision de slug avec une ville existante (française ou belge déjà posée) ?
    let slug = c.slug;
    const { data: clash } = await sb
      .from("cities")
      .select("id, country")
      .eq("slug", slug)
      .limit(1);
    if (clash && clash.length > 0) {
      slug = `${c.slug}-be`;
      suffixed++;
      // double collision (théorique) → CP en dernier recours
      const { data: clash2 } = await sb
        .from("cities")
        .select("id")
        .eq("slug", slug)
        .limit(1);
      if (clash2 && clash2.length > 0) slug = `${c.slug}-${c.postal_code}`;
    }

    if (DRY) {
      if (slug !== c.slug) console.log(`  + [dry] ${c.name} → slug ${slug} (collision)`);
      created++;
      continue;
    }

    const { error } = await sb.from("cities").insert({
      name: c.name,
      slug,
      department_id: deptId,
      postal_code: c.postal_code,
      insee_code: c.nis,
      population: c.population,
      latitude: c.lat,
      longitude: c.lng,
      country: "BE",
    });
    if (error) {
      console.error(`🔴 échec insert ${c.name}:`, error.message);
      continue;
    }
    created++;
    if (slug !== c.slug) console.log(`  ✓ ${c.name} → slug ${slug} (collision résolue)`);
  }

  console.log(`\n════ RÉSULTAT ════`);
  console.log(`  créées   : ${created}`);
  console.log(`  skippées (déjà en base) : ${skipped}`);
  console.log(`  slugs suffixés -be      : ${suffixed}`);

  // ── 4. Vérification finale en base (Règle 4 : preuve) ──
  if (!DRY) {
    const { count } = await sb
      .from("cities")
      .select("id", { count: "exact", head: true })
      .eq("country", "BE");
    const { count: frCount } = await sb
      .from("cities")
      .select("id", { count: "exact", head: true })
      .eq("country", "FR");
    console.log(`\n  Vérif : ${count} communes BE en base (attendu 271), ${frCount} villes FR (doit être inchangé ~12k).`);
  }
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
