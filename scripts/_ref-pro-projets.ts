import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data } = await sb.from("projects")
    .select("id, category_id, status, created_at, city:cities(department_id)")
    .neq("status","deleted");
  const rows = (data||[]) as any[];
  console.log(`projets non supprimes : ${rows.length}`);
  const comboMD = new Set<string>(), depts = new Set<number>(), cats = new Set<number>();
  for (const r of rows) {
    const d = r.city?.department_id ?? null;
    if (d) depts.add(d);
    if (r.category_id) cats.add(r.category_id);
    if (d && r.category_id) comboMD.add(`${r.category_id}-${d}`);
  }
  console.log(`departements avec >=1 projet : ${depts.size} / 107`);
  console.log(`metiers avec >=1 projet      : ${cats.size}`);
  console.log(`combos metier x dept remplis : ${comboMD.size} / 6099 propose (${(comboMD.size/6099*100).toFixed(1)} %)`);
  console.log(`=> ${6099-comboMD.size} pages afficheraient "0 projet recu"`);
  const d90 = rows.filter(r=>new Date(r.created_at) > new Date(Date.now()-90*86400e3));
  console.log(`projets sur 90 jours : ${d90.length}`);
})();
