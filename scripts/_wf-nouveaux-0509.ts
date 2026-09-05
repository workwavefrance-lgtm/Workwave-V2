import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();

const CIBLES = [
  {id:2,slug:"electricien"},{id:39,slug:"videosurveillance"},
  {id:4,slug:"peintre"},{id:37,slug:"vitrier"},
  {id:5,slug:"menuisier"},{id:41,slug:"cuisiniste"},{id:11,slug:"serrurier"},
  {id:10,slug:"facadier"},{id:36,slug:"pisciniste"},{id:199,slug:"ascensoriste"},
  {id:12,slug:"chauffagiste"},{id:13,slug:"climaticien"},{id:38,slug:"ramoneur"},
];

async function main() {
  const DEBUT = "2026-09-05T00:00:00Z";
  let total = 0;
  for (const c of CIBLES) {
    const t0 = Date.now();
    const { count, error } = await sb.from("pros")
      .select("id", { count: "exact", head: true })
      .eq("category_id", c.id).gte("created_at", DEBUT);
    if (error || count === null) { console.log(`${c.slug.padEnd(20)} COMPTAGE EN ERREUR ${error?.message||"(null)"}`); continue; }
    total += count;
    console.log(`${c.slug.padEnd(20)} nouvelles fiches du 05/09 : ${count}   (${Date.now()-t0} ms)`);
  }
  console.log("total sur ces 13 categories :", total);

  // toutes categories confondues, combien de lignes creees le 05/09 ?
  const { count: tot, error: e2 } = await sb.from("pros")
    .select("id", { count: "exact", head: true }).gte("created_at", DEBUT);
  console.log("lignes creees le 05/09 (toutes categories) :", tot === null ? `ERREUR ${e2?.message}` : tot);
}
main();
