/**
 * Reclassement de pros mal classés par NAF ambigu, à partir d'un regex sur le nom.
 *
 * Contexte : certains NAF Sirene couvrent plusieurs métiers (ex. 4332B = menuisier
 * + serrurier, 4334Z = peintre + vitrier, 4322B = chauffagiste + climaticien).
 * Le scraping a donc classé à tort des serruriers comme menuisiers, etc.
 *
 * Ce script UPDATE category_id pour les pros dont le nom matche un regex métier
 * clair, sans toucher à leur slug/description/fiche publique.
 *
 * Règles appliquées (audit Phase B.0, 2026-04-18) :
 *  - menuisier  SERRUR*        -> serrurier   (10 matches attendus)
 *  - peintre+menuisier VITR|MIROIT -> vitrier (5 matches attendus)
 *  - chauffagiste CLIM|FROID   -> climaticien (18 matches attendus)
 *
 * Safety :
 *  - Alerte si pro.claimed_by_user_id (reclasser sa fiche peut être intrusif)
 *  - Dry-run obligatoire d'abord
 *
 * Usage :
 *   npx tsx scripts/reclass-pros-by-regex.ts --dry-run
 *   npx tsx scripts/reclass-pros-by-regex.ts --execute
 */
import { config } from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Rule = {
  target: string;           // slug catégorie cible
  sources: string[];        // slugs catégories où chercher
  regex: RegExp;            // regex sur pro.name
  label: string;            // pour log
};

const RULES: Rule[] = [
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
    target: "climaticien",
    sources: ["chauffagiste"],
    regex: /\b(CLIM|FROID)/i,
    label: "CLIM|FROID",
  },
];

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const isExecute = args.includes("--execute");
  if (!isDryRun && !isExecute) {
    console.error("Usage : --dry-run | --execute");
    process.exit(1);
  }

  console.log(`\nMode : ${isDryRun ? "DRY-RUN" : "EXECUTE"}\n`);

  // 1. Charger les ids de toutes les catégories impliquées
  const allSlugs = new Set<string>();
  RULES.forEach((r) => {
    allSlugs.add(r.target);
    r.sources.forEach((s) => allSlugs.add(s));
  });

  const { data: cats } = await supabase
    .from("categories")
    .select("id, slug")
    .in("slug", [...allSlugs]);

  if (!cats) {
    console.error("Aucune catégorie trouvée.");
    process.exit(1);
  }

  const idBySlug = new Map<string, number>(cats.map((c) => [c.slug as string, c.id as number]));

  // Vérifier que toutes les cibles existent
  for (const rule of RULES) {
    if (!idBySlug.has(rule.target)) {
      console.error(`❌ Catégorie cible absente : ${rule.target}`);
      process.exit(1);
    }
    for (const src of rule.sources) {
      if (!idBySlug.has(src)) {
        console.error(`❌ Catégorie source absente : ${src}`);
        process.exit(1);
      }
    }
  }

  // 2. Pour chaque règle, charger pros sources et filtrer
  let totalReclass = 0;
  const plan: Array<{ rule: Rule; matches: { id: number; name: string; claimed: boolean }[] }> = [];

  for (const rule of RULES) {
    const sourceIds = rule.sources.map((s) => idBySlug.get(s)!);

    // Paginer les pros sources
    let allPros: { id: number; name: string; category_id: number; claimed_by_user_id: string | null }[] = [];
    let offset = 0;
    const PAGE = 1000;
    while (true) {
      const { data } = await supabase
        .from("pros")
        .select("id, name, category_id, claimed_by_user_id")
        .in("category_id", sourceIds)
        .eq("is_active", true)
        .is("deleted_at", null)
        .range(offset, offset + PAGE - 1);
      if (!data || data.length === 0) break;
      allPros = allPros.concat(data as typeof allPros);
      if (data.length < PAGE) break;
      offset += PAGE;
    }

    const matches = allPros
      .filter((p) => rule.regex.test(p.name))
      .map((p) => ({
        id: p.id as number,
        name: p.name as string,
        claimed: p.claimed_by_user_id !== null,
      }));

    plan.push({ rule, matches });
    totalReclass += matches.length;
  }

  // 3. Affichage plan
  console.log("=== PLAN DE RECLASSEMENT ===\n");
  for (const { rule, matches } of plan) {
    const claimed = matches.filter((m) => m.claimed).length;
    console.log(`[${rule.target}] via ${rule.sources.join("+")} / /${rule.label}/ : ${matches.length} matches${claimed > 0 ? ` (⚠ ${claimed} claimed)` : ""}`);
    matches.forEach((m) => {
      console.log(`  - #${m.id} ${m.name}${m.claimed ? " [CLAIMED]" : ""}`);
    });
  }
  console.log(`\nTOTAL : ${totalReclass} pros à reclasser\n`);

  if (isDryRun) {
    console.log("✅ DRY-RUN terminé. Relancer avec --execute pour appliquer.");
    return;
  }

  // Vérif : aucun claimed (par sécurité)
  const anyClaimed = plan.some(({ matches }) => matches.some((m) => m.claimed));
  if (anyClaimed) {
    console.error("\n❌ Des pros claimed sont dans le lot. Ne pas reclasser automatiquement.");
    console.error("   Editer ce script pour gérer le cas manuellement ou filtrer ces ids.");
    process.exit(1);
  }

  // 4. EXECUTE : UPDATE category_id
  console.log("\n=== EXECUTE ===\n");
  let totalDone = 0;
  for (const { rule, matches } of plan) {
    if (matches.length === 0) continue;
    const targetId = idBySlug.get(rule.target)!;
    const ids = matches.map((m) => m.id);

    console.log(`[${rule.target}] UPDATE ${ids.length} pros -> category_id=${targetId}...`);
    const { error, count } = await supabase
      .from("pros")
      .update({ category_id: targetId }, { count: "exact" })
      .in("id", ids);

    if (error) {
      console.error(`  ❌ Erreur :`, error.message);
      process.exit(1);
    }
    console.log(`  ✅ ${count} pros reclassés`);
    totalDone += count || 0;
  }

  console.log(`\nTOTAL reclassé : ${totalDone}\n`);

  // 5. Vérification post-update
  console.log("=== VÉRIF POST-UPDATE ===\n");
  for (const rule of RULES) {
    const { count } = await supabase
      .from("pros")
      .select("id", { count: "exact", head: true })
      .eq("category_id", idBySlug.get(rule.target)!)
      .eq("is_active", true)
      .is("deleted_at", null);
    console.log(`  ${rule.target.padEnd(15)} : ${count} pros actifs`);
  }
  console.log("\n✅ Reclassement terminé.");
}

main().catch((e) => {
  console.error("Erreur fatale :", e);
  process.exit(1);
});
