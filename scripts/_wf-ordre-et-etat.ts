import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function main() {
  // 1. ORDRE EXACT rendu par la requete du scraper (aucun .order())
  for (const v of ["domicile", "personne"]) {
    const { data, error } = await sb
      .from("categories")
      .select("id, slug, name, naf_codes, vertical")
      .eq("vertical", v);
    if (error) throw error;
    console.log(`\n=== ORDRE rendu pour --vertical ${v} (${data!.length} cat) ===`);
    console.log(data!.map((c: any, i) => `${i}:${c.slug}(${c.id})`).join("  "));
  }

  // 2. Comptages exacts en base pour les 6 categories concernees
  const ids = [19, 40, 198, 29, 32];
  console.log("\n=== COMPTAGES en base (count exact, filtre sur colonne indexee category_id) ===");
  for (const id of ids) {
    const tot = await sb.from("pros").select("id", { count: "exact", head: true }).eq("category_id", id);
    const ouv = await sb.from("pros").select("id", { count: "exact", head: true }).eq("category_id", id).neq("etat_admin", "F");
    const act = await sb.from("pros").select("id", { count: "exact", head: true }).eq("category_id", id).eq("is_active", true).is("deleted_at", null);
    console.log(
      `cat ${String(id).padStart(3)} : total=${tot.count === null ? "NULL(ERREUR)" : tot.count}` +
        `  non-fermees=${ouv.count === null ? "NULL(ERREUR)" : ouv.count}` +
        `  actives=${act.count === null ? "NULL(ERREUR)" : act.count}` +
        `  ${tot.error ? "ERR:" + tot.error.message : ""}`
    );
  }

  // 3. Repartition naf_code reel des lignes de chaque categorie
  console.log("\n=== naf_code REEL stocke sur les lignes (echantillon 1000) ===");
  for (const id of ids) {
    const { data } = await sb.from("pros").select("naf_code").eq("category_id", id).range(0, 999);
    const c: Record<string, number> = {};
    for (const r of data || []) c[r.naf_code ?? "null"] = (c[r.naf_code ?? "null"] || 0) + 1;
    console.log(`cat ${id} : ${JSON.stringify(c)}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
