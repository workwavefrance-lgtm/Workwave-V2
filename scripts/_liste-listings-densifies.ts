/**
 * Les listings des villes densifiees hier : Google les a vus maigres
 * (61 plombiers a Montpellier quand la ville en compte 323), ils ne le sont
 * plus. Ce sont les pages ou le changement est le plus fort, donc celles qui
 * meritent le quota de ping avant les autres.
 */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import fs from "fs";
const sb = getServiceClient();
const DEPTS = ["75", "13", "69", "59", "33", "31", "44", "34", "06", "67", "35", "38", "76", "83", "92", "93", "94", "77", "78", "95"];
const METIERS = ["plombier", "electricien", "macon", "peintre", "menuisier", "couvreur", "chauffagiste", "carreleur"];
(async () => {
  const { data: depts } = await sb.from("departments").select("id, code").in("code", DEPTS);
  const ids = (depts || []).map((d: any) => d.id);
  // Les plus grandes villes de ces departements
  const { data: villes } = await sb.from("cities").select("slug, population")
    .in("department_id", ids).not("population", "is", null)
    .order("population", { ascending: false }).limit(40);
  const urls: string[] = [];
  for (const v of (villes || []) as any[]) for (const m of METIERS) urls.push(`https://workwave.fr/${m}/${v.slug}`);
  fs.writeFileSync("scripts/listings-densifies.txt", urls.join("\n") + "\n");
  console.log(`${urls.length} adresses ecrites dans scripts/listings-densifies.txt`);
  console.log(`  ${(villes || []).length} villes x ${METIERS.length} metiers`);
  console.log(`  exemples : ${urls.slice(0, 3).join(" · ")}`);
})();
