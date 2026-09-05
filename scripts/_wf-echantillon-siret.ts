import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import fs from "fs";
const sb = getServiceClient();
const DEBUT = "2026-09-05T07:00:00Z";

async function ligneA(idMin: number) {
  const { data } = await sb.from("pros").select("id, created_at").gte("id", idMin).order("id").limit(1)
    .abortSignal(AbortSignal.timeout(60_000));
  return data?.[0] || null;
}

(async () => {
  const { data: maxRow } = await sb.from("pros").select("id, created_at").order("id", { ascending: false }).limit(1);
  const maxId = maxRow![0].id as number;
  console.log(`id max = ${maxId} (cree ${maxRow![0].created_at})`);

  // Recherche dichotomique de la premiere ligne creee pendant le run.
  let bas = 1, haut = maxId, debutId = maxId;
  while (bas <= haut) {
    const mid = Math.floor((bas + haut) / 2);
    const r = await ligneA(mid);
    if (!r) { haut = mid - 1; continue; }
    if (String(r.created_at) >= DEBUT) { debutId = r.id; haut = mid - 1; } else { bas = mid + 1; }
  }
  console.log(`premiere ligne du run : id ${debutId}`);
  console.log(`plage du run : ${maxId - debutId + 1} identifiants`);

  // Echantillon reparti : 25 points de depart tires au hasard dans la plage,
  // 20 lignes consecutives a chaque point.
  const vus = new Set<number>();
  const ech: any[] = [];
  for (let i = 0; i < 25; i++) {
    const start = debutId + Math.floor(Math.random() * (maxId - debutId - 20));
    const { data } = await sb.from("pros")
      .select("id, siret, slug, name, founding_date, created_at, city_id, category_id")
      .gte("id", start).order("id").limit(20).abortSignal(AbortSignal.timeout(60_000));
    for (const r of data || []) {
      if (String(r.created_at) < DEBUT) continue;
      if (!r.siret || vus.has(r.id)) continue;
      vus.add(r.id); ech.push(r);
    }
  }
  console.log(`echantillon : ${ech.length} lignes creees pendant le run`);
  fs.writeFileSync("/tmp/wf-echantillon.json", JSON.stringify(ech, null, 1));
  console.log("ecrit dans /tmp/wf-echantillon.json");
})();
