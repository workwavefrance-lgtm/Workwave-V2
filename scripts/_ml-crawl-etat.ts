import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  const slugs = fs.readFileSync("/tmp/slugs_gb.txt", "utf8").trim().split("\n").filter(Boolean);
  const par: Record<string, number> = {}; let vus = 0;
  for (let i = 0; i < slugs.length; i += 200) {
    const { data } = await sb.from("pros").select("slug, etat_admin, categories(vertical)").in("slug", slugs.slice(i, i + 200));
    for (const p of (data || []) as any[]) { vus++; const k = `${p.etat_admin || "?"}/${p.categories?.vertical || "?"}`; par[k] = (par[k] || 0) + 1; }
  }
  console.log(`fiches distinctes crawlees par Googlebot le 03/09 (reponses 200) : ${slugs.length}, retrouvees en base : ${vus}`);
  for (const [k, v] of Object.entries(par).sort((a,b)=>b[1]-a[1])) console.log(`  ${v}  etat=${k.split("/")[0]} vertical=${k.split("/")[1]}  (${(100*v/vus).toFixed(1)} %)`);
  // rappel de la repartition en base
  const { count: nA } = await sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null).eq("etat_admin", "A");
  const { count: nF } = await sb.from("pros").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null).eq("etat_admin", "F");
  console.log(`\nen base : ouvertes=${nA} fermees=${nF}`);
}
main();
