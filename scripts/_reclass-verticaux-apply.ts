/**
 * RECLASS verticaux urgence/pénurie (validé par Willy le 11/06, dry-run OK) :
 *   menuisier    → serrurier   (regex SERRUR,            2 332 pros, 0 réclamé)
 *   chauffagiste → climaticien (regex CLIM|FROID|CVC,    5 203 pros, 0 réclamé)
 *
 * Mécanique NON destructive : la catégorie d'origine devient SECONDAIRE
 * (le pro continue de recevoir les leads de son ancien métier — le broadcast
 * couvre secondary_category_ids), et il gagne sa visibilité sur les pages du
 * nouveau métier. Réversible (filtre possible sur secondary contient from).
 *
 * Sécurité : skip pros réclamés ; chaque update vérifie { error } (leçon 08/06) ;
 * comptes avant/après en preuve. Pagination PostgREST cap 1000 (leçon 09/05).
 *
 * Usage : npx tsx scripts/_reclass-verticaux-apply.ts
 */
import * as dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAPPINGS = [
  { from: "menuisier", to: "serrurier", pattern: "name.ilike.%SERRUR%" },
  { from: "chauffagiste", to: "climaticien", pattern: "name.ilike.%CLIM%,name.ilike.%FROID%,name.ilike.%CVC%" },
];

async function countCat(catId: number): Promise<number> {
  const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("category_id", catId).eq("is_active", true).is("deleted_at", null);
  return count || 0;
}

async function main() {
  const { data: cats } = await sb.from("categories").select("id, slug")
    .in("slug", ["menuisier", "serrurier", "chauffagiste", "climaticien"]);
  const cid = Object.fromEntries((cats || []).map((c: { id: number; slug: string }) => [c.slug, c.id]));

  for (const m of MAPPINGS) {
    const fromId = cid[m.from], toId = cid[m.to];
    const beforeTo = await countCat(toId);
    console.log(`\n════ ${m.from} → ${m.to} ════`);
    console.log(`  ${m.to} avant : ${beforeTo} pros`);

    // 1) Charger les candidats (id + secondaires), pagination cap-1000-proof
    const rows: { id: number; secondary_category_ids: number[] | null }[] = [];
    let offset = 0;
    while (true) {
      const { data, error } = await sb.from("pros")
        .select("id, secondary_category_ids")
        .eq("category_id", fromId).eq("is_active", true).is("deleted_at", null)
        .is("claimed_by_user_id", null) // sécurité : jamais un pro réclamé
        .or(m.pattern)
        .range(offset, offset + 999);
      if (error) { console.error("  ✗ SELECT:", error.message); process.exit(1); }
      const batch = data || [];
      if (batch.length === 0) break;
      rows.push(...(batch as typeof rows));
      offset += batch.length;
    }
    console.log(`  candidats chargés : ${rows.length}`);

    // 2) Grouper : secondaires vides (cas massif, batch) vs non vides (individuel)
    const empty = rows.filter((r) => !r.secondary_category_ids || r.secondary_category_ids.length === 0);
    const nonEmpty = rows.filter((r) => r.secondary_category_ids && r.secondary_category_ids.length > 0);
    console.log(`  secondaires vides : ${empty.length} (batch) · non vides : ${nonEmpty.length} (individuel)`);

    let updated = 0, failed = 0;

    // 2a) batchs de 400 ids → même payload {category_id: to, secondary: [from]}
    for (let i = 0; i < empty.length; i += 400) {
      const ids = empty.slice(i, i + 400).map((r) => r.id);
      const { error, count } = await sb.from("pros")
        .update({ category_id: toId, secondary_category_ids: [fromId] }, { count: "exact" })
        .in("id", ids);
      if (error) { console.error(`  ✗ batch ${i}: ${error.message}`); failed += ids.length; }
      else updated += count ?? ids.length;
    }

    // 2b) individuels : préserver les secondaires existants
    for (const r of nonEmpty) {
      const sec = (r.secondary_category_ids || []).filter((x) => x !== toId);
      if (!sec.includes(fromId)) sec.push(fromId);
      const { error } = await sb.from("pros")
        .update({ category_id: toId, secondary_category_ids: sec })
        .eq("id", r.id);
      if (error) { console.error(`  ✗ pro ${r.id}: ${error.message}`); failed++; }
      else updated++;
    }

    // 3) PREUVE : re-compter en base (jamais se fier au log, leçon 08/06)
    const afterTo = await countCat(toId);
    console.log(`  ✓ updates OK : ${updated} · échecs : ${failed}`);
    console.log(`  ${m.to} APRÈS : ${afterTo} pros (delta réel : +${afterTo - beforeTo})`);
  }
  console.log("\nTerminé.");
}

main().catch((e) => { console.error(e); process.exit(1); });
