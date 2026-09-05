import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb: any = getServiceClient();

(async () => {
  // 1) etat actuel de la vue materialisee (lecture, instantane)
  const { data: totalVue, error: eVue } = await sb.rpc("sitemap_listings_total");
  console.log("vue listing_cat_ville AUJOURD'HUI :", eVue ? "ERREUR " + eVue.message : totalVue);

  // 2) categories des verticaux BTP/domicile/personne
  const cats: number[] = [];
  let off = 0;
  while (true) {
    const { data } = await sb.from("categories").select("id, vertical").range(off, off + 999);
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows) if (["btp", "domicile", "personne"].includes(r.vertical)) cats.push(r.id);
    off += rows.length;
  }
  console.log("categories BTP/domicile/personne :", cats.length);
  const catSet = new Set(cats);

  // 3) toutes les villes
  const villes: number[] = [];
  off = 0;
  while (true) {
    const { data } = await sb.from("cities").select("id").range(off, off + 999);
    const rows = data || [];
    if (rows.length === 0) break;
    for (const r of rows) villes.push(r.id);
    off += rows.length;
  }
  console.log("communes :", villes.length);

  // 4) couples (metier, ville) avec >= 3 artisans OUVERTS, par lots de villes
  const LOT = 1500;
  let couples = 0, couplesTousVerticaux = 0, echecs = 0;
  const communesAvec = new Set<number>();
  for (let i = 0; i < villes.length; i += LOT) {
    const lot = villes.slice(i, i + LOT);
    let ok = false;
    for (let essai = 0; essai < 4 && !ok; essai++) {
      const { data, error } = await sb.rpc("sitemap_city_cat_counts", { p_city_ids: lot });
      if (error) { await new Promise((r) => setTimeout(r, 4000)); continue; }
      const arr = (data || []) as { c: number; v: number; n: number }[];
      couplesTousVerticaux += arr.length;
      for (const x of arr) if (catSet.has(x.c)) { couples++; communesAvec.add(x.v); }
      ok = true;
    }
    if (!ok) { echecs++; console.log(`lot ${i}-${i + lot.length} ECHEC`); }
    if ((i / LOT) % 5 === 0) console.log(`  ...${i + lot.length}/${villes.length} villes, ${couples} couples`);
  }
  console.log("=== couples metier x ville >= 3 artisans OUVERTS (verticaux BTP/domicile/personne) :", couples);
  console.log("=== dont communes distinctes :", communesAvec.size);
  console.log("=== couples tous verticaux confondus :", couplesTousVerticaux, "| lots en echec :", echecs);
})();
