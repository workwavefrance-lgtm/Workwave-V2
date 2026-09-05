import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DEBUT = "2026-09-05T00:00:00+02:00";
const FIN   = "2026-09-06T00:00:00+02:00";

async function c(label: string, q: any) {
  const { count, error } = await q;
  if (error) { console.log(`${label}: ERREUR ${error.message}`); return; }
  if (count === null) { console.log(`${label}: count NULL = ERREUR`); return; }
  console.log(`${label}: ${count}`);
}

async function main() {
  await c("total cree le 05/09 (relecture)", sb.from("pros").select("id", { count: "exact", head: true }).gte("created_at", DEBUT).lt("created_at", FIN));
  await c("cree le 05/09 hors les 25 categories du run", sb.from("pros").select("id", { count: "exact", head: true }).gte("created_at", DEBUT).lt("created_at", FIN)
    .not("category_id", "in", "(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,36,37,38,39,41,199,200)"));
  await c("cree APRES le 05/09 (postérieur au run)", sb.from("pros").select("id", { count: "exact", head: true }).gte("created_at", FIN));
  // Les 4 categories a zero : total en base toutes dates confondues
  for (const [id, nom] of [[11,"serrurier"],[13,"climaticien"],[37,"vitrier"],[199,"ascensoriste"],[12,"chauffagiste"],[5,"menuisier"],[4,"peintre"],[36,"pisciniste"]] as [number,string][]) {
    await c(`  ${nom} : total en base (toutes dates)`, sb.from("pros").select("id", { count: "exact", head: true }).eq("category_id", id));
  }
}
main();
