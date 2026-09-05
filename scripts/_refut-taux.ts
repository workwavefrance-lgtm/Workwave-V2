import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const slugs = fs.readFileSync("/tmp/serr_slugs.txt", "utf8").split("\n").filter(Boolean);
  // resoudre les slugs qui sont de VRAIES villes
  const villes: { id: number; slug: string }[] = [];
  for (let i = 0; i < slugs.length; i += 200) {
    const { data } = await sb.from("cities").select("id,slug").in("slug", slugs.slice(i, i + 200));
    villes.push(...((data as any) || []));
  }
  console.log("slugs emis :", slugs.length, "-> dont villes reelles en base :", villes.length);
  const { data: cats } = await sb.from("categories").select("id,slug,vertical");
  const btp = (cats || []).filter((c: any) => ["btp","domicile","personne"].includes(c.vertical));
  const cityIds = villes.map((v) => v.id);
  // combos (categorie, ville) avec >=1 pro OUVERT parmi les villes emises
  const combos = new Set<string>();
  for (let i = 0; i < cityIds.length; i += 60) {
    const chunk = cityIds.slice(i, i + 60);
    let offset = 0;
    while (true) {
      const { data, error } = await sb.from("pros").select("category_id,city_id")
        .in("city_id", chunk).eq("is_active", true).is("deleted_at", null)
        .neq("etat_admin", "F").range(offset, offset + 999);
      if (error) { console.error("err", error.message); break; }
      const rows = data || [];
      if (rows.length === 0) break;
      for (const r of rows as any[]) combos.add(`${r.category_id}:${r.city_id}`);
      offset += rows.length;
    }
  }
  const btpIds = new Set(btp.map((c: any) => c.id));
  let ok = 0;
  for (const k of combos) if (btpIds.has(Number(k.split(":")[0]))) ok++;
  const total = btp.length * villes.length;
  console.log(`combos emis (57 metiers x ${villes.length} villes) :`, total);
  console.log("  combos avec >=1 pro OUVERT (donc 200) :", ok);
  console.log("  combos sans pro ouvert (donc 308)     :", total - ok);
  console.log("  => taux de 308 REEL : %s%%", (100 * (total - ok) / total).toFixed(1));
})();
