import { config } from "dotenv"; import path from "path"; import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

async function main() {
  const tout: Record<string, { siret: string; nom: string }[]> = JSON.parse(fs.readFileSync("/tmp/_wf_4329B_depts.json", "utf8"));
  for (const [dept, liste] of Object.entries(tout)) {
    const sirets = liste.map((x) => x.siret);
    const trouves = new Map<string, any>();
    for (let i = 0; i < sirets.length; i += 100) {
      const lot = sirets.slice(i, i + 100);
      for (let essai = 0; essai < 4; essai++) {
        const r = await sb.from("pros").select("siret, category_id, naf_code, etat_admin").in("siret", lot);
        if (!r.error) { (r.data || []).forEach((x: any) => trouves.set(x.siret, x)); break; }
        if (essai === 3) throw new Error(r.error.message);
        await new Promise((res) => setTimeout(res, 3000));
      }
    }
    const absents = liste.filter((x) => !trouves.has(x.siret));
    const parCat = new Map<number, number>();
    for (const v of trouves.values()) parCat.set(v.category_id, (parCat.get(v.category_id) || 0) + 1);
    console.log(`dept ${dept} : Sirene ouverts ${liste.length} | en base ${trouves.size} | ABSENTS ${absents.length} | cats ${JSON.stringify([...parCat.entries()])}`);
    if (absents.length) console.log("   exemples absents :", JSON.stringify(absents.slice(0, 5).map((a) => a.nom)));
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
