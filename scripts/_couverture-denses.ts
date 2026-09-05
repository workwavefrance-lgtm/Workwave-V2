/**
 * Notre couverture face au registre, sur les 20 departements les plus denses
 * et les 6 metiers a plus fort volume de recherche.
 *
 * POURQUOI : les listings grandes villes sortent en position 35 a 57 sur
 * « plombier montpellier », « plombier bordeaux »… Hypothese : la page est
 * trop maigre pour la requete. Le scraper Sirene ne ramenait que les 1 000
 * premiers par metier x departement jusqu'au 04/08/2026 (curseur absent au
 * premier appel), et les departements DENSES etaient les seuls touches.
 */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import fs from "fs";
const sb = getServiceClient();
const METIERS = ["plombier", "electricien", "macon", "peintre", "menuisier", "couvreur"];
const DEPTS = ["75", "13", "69", "59", "33", "31", "44", "34", "06", "67", "35", "38", "76", "83", "92", "93", "94", "77", "78", "95"];
(async () => {
  const sirene: Record<string, number> = JSON.parse(fs.readFileSync("/tmp/sirene_depts.json", "utf8"));
  const { data: cats } = await sb.from("categories").select("id, slug").in("slug", METIERS);
  const { data: depts } = await sb.from("departments").select("id, code, name").in("code", DEPTS);
  const idCat = new Map((cats || []).map((c: any) => [c.slug, c.id]));
  const couples: any[] = [];
  for (const m of METIERS) for (const d of depts || []) couples.push({ m, d });

  const res: any[] = [];
  let i = 0;
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (i < couples.length) {
      const { m, d } = couples[i++];
      const { count, error } = await sb.from("pros")
        .select("id, cities!inner(department_id)", { count: "exact", head: true })
        .eq("category_id", idCat.get(m)).eq("cities.department_id", d.id)
        .eq("is_active", true).is("deleted_at", null).or("etat_admin.is.null,etat_admin.neq.F");
      if (error) console.log(`  erreur ${m} ${d.code} : ${error.message}`);
      else res.push({ m, dept: d.code, nom: d.name, nous: count || 0, sirene: sirene[`${m}|${d.code}`] ?? -1 });
    }
  }));

  const bons = res.filter((x) => x.sirene > 0);
  console.log("  metier        dept  departement            nous   registre   couverture");
  for (const x of bons.sort((a, b) => (a.nous / a.sirene) - (b.nous / b.sirene)).slice(0, 25)) {
    console.log(`  ${x.m.padEnd(13)} ${x.dept}   ${x.nom.slice(0, 20).padEnd(21)} ${String(x.nous).padStart(6)} ${String(x.sirene).padStart(10)}    ${(x.nous / x.sirene * 100).toFixed(0).padStart(4)} %`);
  }
  const n = bons.reduce((s, x) => s + x.nous, 0), sr = bons.reduce((s, x) => s + x.sirene, 0);
  console.log(`\n  ${bons.length} couples mesures`);
  console.log(`  nous : ${n} fiches ouvertes · registre : ${sr} etablissements ouverts · couverture ${(n / sr * 100).toFixed(1)} %`);
  console.log(`  manquants sur ces 6 metiers x 20 departements : ${sr - n}`);
  fs.writeFileSync("/tmp/couverture-denses.json", JSON.stringify(bons, null, 1));
})();
