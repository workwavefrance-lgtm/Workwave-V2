import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import fs from "fs";

(async () => {
  const sb = getServiceClient();
  const { data: cats } = await sb.from("categories").select("id, slug")
    .in("vertical", ["btp", "domicile", "personne"]).order("id");
  const { data: depts } = await sb.from("departments").select("id").order("id");
  const villes: string[] = [];
  for (const d of depts!) {
    const { data: c } = await sb.from("cities").select("slug, population")
      .eq("department_id", d.id).order("population", { ascending: false, nullsFirst: false }).limit(15);
    (c || []).slice(0, 10).forEach((x: any) => villes.push(x.slug));
  }
  const villesU = Array.from(new Set(villes));
  console.log("villes liees (uniques) :", villesU.length, "| metiers :", cats!.length);

  // lecture de la vue materialisee (seuil >= 3)
  const paires = new Set<string>();
  let offset = 0;
  while (true) {
    const { data, error } = await sb.from("listing_cat_ville").select("metier, ville")
      .range(offset, offset + 999);
    if (error) { console.error("vue:", error.message); process.exit(1); }
    const rows = data || [];
    if (rows.length === 0) break;
    rows.forEach((r: any) => paires.add(`${r.metier}|${r.ville}`));
    offset += rows.length;
  }
  console.log("lignes vue listing_cat_ville :", paires.size);

  let tot = 0, avecVue = 0;
  const horsVue: string[] = [];
  for (const m of cats!) for (const v of villesU) {
    tot++;
    if (paires.has(`${m.slug}|${v}`)) avecVue++; else horsVue.push(`${m.slug}/${v}`);
  }
  console.log(`liens ville emis (57 x ${villesU.length}) : ${tot}`);
  console.log(`  certains 200 (>=3 pros ouverts) : ${avecVue} (${(avecVue/tot*100).toFixed(1)} %)`);
  console.log(`  a determiner (0,1 ou 2 pros)    : ${horsVue.length} (${(horsVue.length/tot*100).toFixed(1)} %)`);
  // echantillon aleatoire des "hors vue" pour calibration HTTP
  const ech: string[] = [];
  const copy = horsVue.slice();
  let seed = 12345;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < 120 && copy.length; i++) ech.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
  fs.writeFileSync("/tmp/horsvue_ech.txt", ech.join("\n"));
  console.log("echantillon hors-vue ecrit : /tmp/horsvue_ech.txt");
})();
