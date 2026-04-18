/**
 * Audit lecture seule : combien de pros parmi les catégories "absorbantes"
 * ont un nom qui matche un regex métier spécifique ?
 *
 * Objectif : décider si on reclasse depuis l'existant (rapide) ou si on re-scrape Sirene.
 *
 * Catégories cibles vides ou faibles (à enrichir) :
 *  - serrurier  (NAF 4332B partagé avec menuisier)
 *  - climaticien (NAF 4322B partagé avec chauffagiste)
 *  - cheministe  (NAF 4322B)
 *  - vitrier    (NAF 4334Z partagé avec peintre)
 *  - ramoneur   (NAF 4322B)
 *
 * Usage : npx tsx scripts/audit-regex-reclassification.ts
 */
import { config } from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// (slug catégorie cible, slugs catégories sources où chercher, regex sur name)
const RECLASS_RULES: Array<{
  target: string;
  sources: string[];
  regex: RegExp;
  label: string;
}> = [
  {
    target: "serrurier",
    sources: ["menuisier"],
    regex: /\bSERRUR/i,
    label: "SERRUR",
  },
  {
    target: "vitrier",
    sources: ["peintre", "menuisier"],
    regex: /\b(VITR|MIROIT)/i,
    label: "VITR|MIROIT",
  },
  {
    target: "ramoneur",
    sources: ["chauffagiste", "cheministe", "climaticien"],
    regex: /\bRAMON/i,
    label: "RAMON",
  },
  {
    target: "cheministe",
    sources: ["chauffagiste", "climaticien", "ramoneur"],
    regex: /\b(CHEMIN|POELE|POÊLE|FUMIST)/i,
    label: "CHEMIN|POELE|FUMIST",
  },
  {
    target: "climaticien",
    sources: ["chauffagiste", "cheministe", "ramoneur"],
    regex: /\b(CLIM|FROID)/i,
    label: "CLIM|FROID",
  },
];

async function main() {
  // 1. Charger les ids des catégories
  const allSlugs = new Set<string>();
  RECLASS_RULES.forEach((r) => {
    allSlugs.add(r.target);
    r.sources.forEach((s) => allSlugs.add(s));
  });

  const { data: cats } = await supabase
    .from("categories")
    .select("id, slug, name")
    .in("slug", [...allSlugs]);

  if (!cats) {
    console.error("Aucune catégorie chargée.");
    return;
  }

  const idBySlug = new Map<string, number>(cats.map((c) => [c.slug as string, c.id as number]));
  const nameBySlug = new Map<string, string>(cats.map((c) => [c.slug as string, c.name as string]));

  // 2. Compter les pros par catégorie cible (état actuel)
  console.log("\n=== ÉTAT ACTUEL DES CATÉGORIES CIBLES ===\n");
  for (const rule of RECLASS_RULES) {
    const id = idBySlug.get(rule.target);
    if (!id) {
      console.log(`  ${rule.target.padEnd(15)} : N/A (cat absente)`);
      continue;
    }
    const { count } = await supabase
      .from("pros")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id)
      .eq("is_active", true)
      .is("deleted_at", null);
    console.log(`  ${rule.target.padEnd(15)} : ${count} pros actifs`);
  }

  // 3. Pour chaque règle, charger tous les pros des catégories sources, filtrer par regex
  console.log("\n\n=== MATCHES POTENTIELS PAR RECLASSEMENT ===\n");

  for (const rule of RECLASS_RULES) {
    const sourceIds = rule.sources
      .map((s) => idBySlug.get(s))
      .filter((id): id is number => id !== undefined);

    if (sourceIds.length === 0) {
      console.log(`\n[${rule.target}] aucune source trouvée`);
      continue;
    }

    // Charger tous les pros des sources (paginé)
    let allPros: { id: number; name: string; slug: string; category_id: number }[] = [];
    let offset = 0;
    const PAGE = 1000;
    while (true) {
      const { data } = await supabase
        .from("pros")
        .select("id, name, slug, category_id")
        .in("category_id", sourceIds)
        .eq("is_active", true)
        .is("deleted_at", null)
        .range(offset, offset + PAGE - 1);
      if (!data || data.length === 0) break;
      allPros = allPros.concat(data as typeof allPros);
      if (data.length < PAGE) break;
      offset += PAGE;
    }

    const matches = allPros.filter((p) => rule.regex.test(p.name));

    const sourceLabels = rule.sources.map((s) => `${s} (${nameBySlug.get(s)})`).join(", ");
    console.log(`\n[${rule.target}] regex /${rule.label}/`);
    console.log(`  Sources : ${sourceLabels}`);
    console.log(`  Total pros sources : ${allPros.length}`);
    console.log(`  Matches regex      : ${matches.length}`);
    if (matches.length > 0) {
      console.log(`  Premiers matches (10 max) :`);
      matches.slice(0, 10).forEach((p) => {
        console.log(`    - ${p.name}`);
      });
    }
  }

  console.log("\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
