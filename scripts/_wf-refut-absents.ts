import { config } from "dotenv"; import path from "path"; import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function main() {
  const liste: { siret: string; nom: string }[] = JSON.parse(fs.readFileSync("/tmp/_wf_4329B_paris.json", "utf8"));
  const sirets = liste.map((x) => x.siret);
  const trouves = new Map<string, any>();
  for (let i = 0; i < sirets.length; i += 100) {
    const lot = sirets.slice(i, i + 100);
    let ok = false;
    for (let essai = 0; essai < 4 && !ok; essai++) {
      const r = await sb.from("pros").select("siret, category_id, naf_code, etat_admin, is_active, deleted_at, city_id").in("siret", lot);
      if (!r.error) { (r.data || []).forEach((x: any) => trouves.set(x.siret, x)); ok = true; }
      else if (essai === 3) throw new Error(r.error.message);
      else await new Promise((res) => setTimeout(res, 3000));
    }
  }
  const absents = liste.filter((x) => !trouves.has(x.siret));
  console.log(`Sirene 43.29B Paris (ouverts) : ${liste.length}`);
  console.log(`  presents en base (peu importe la categorie) : ${trouves.size}`);
  console.log(`  ABSENTS de la base : ${absents.length}`);
  const parCat = new Map<number, number>();
  const marquesF = [...trouves.values()].filter((x) => x.etat_admin === "F").length;
  const supprimes = [...trouves.values()].filter((x) => x.deleted_at).length;
  for (const v of trouves.values()) parCat.set(v.category_id, (parCat.get(v.category_id) || 0) + 1);
  console.log(`  parmi les presents : etat_admin='F' en base ${marquesF}, deleted_at ${supprimes}`);
  console.log("  repartition par categorie :", JSON.stringify([...parCat.entries()]));
  console.log("  exemples d'absents :", JSON.stringify(absents.slice(0, 8)));
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
