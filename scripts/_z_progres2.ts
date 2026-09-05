import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const depuis = "2026-09-05T07:30:00Z";
  const lignes: any[] = [];
  let off = 0;
  for (let page = 0; page < 60; page++) {
    let ok = false;
    for (let e = 0; e < 4 && !ok; e++) {
      const { data, error } = await sb.from("pros").select("created_at").gte("created_at", depuis).order("created_at").range(off, off + 999);
      if (error) { console.log(`  erreur page ${page} essai ${e} : ${error.message || "(vide)"}`); await new Promise(r=>setTimeout(r,3000)); continue; }
      ok = true;
      const r = data || [];
      lignes.push(...r); off += r.length;
      if (r.length < 1000) { page = 999; }
    }
    if (!ok) { console.log("abandon"); break; }
  }
  const min = (Date.now() - new Date(depuis).getTime()) / 60000;
  console.log(`${min.toFixed(1)} min ecoulees · ${lignes.length} fiches creees · ${(lignes.length/min).toFixed(0)} fiches/min`);
  if (lignes.length) console.log("derniere :", lignes[lignes.length-1].created_at);
})();
