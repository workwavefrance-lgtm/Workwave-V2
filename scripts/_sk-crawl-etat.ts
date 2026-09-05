import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
async function main() {
  const sb = getServiceClient();
  const f = process.argv[2] || "/tmp/slugs_gb_verif.txt";
  const slugs = fs.readFileSync(f, "utf8").trim().split("\n").filter(Boolean);
  const par: Record<string, number> = {}; let vus = 0;
  for (let i = 0; i < slugs.length; i += 200) {
    const { data, error } = await sb.from("pros").select("slug, etat_admin, categories(vertical)").in("slug", slugs.slice(i, i + 200));
    if (error) { console.log("ERREUR", error.message); return; }
    for (const p of (data || []) as any[]) { vus++; const k = `${p.etat_admin || "null"}`; par[k] = (par[k] || 0) + 1; }
  }
  console.log(`${f} : ${slugs.length} slugs, retrouves en base : ${vus}`);
  for (const [k, v] of Object.entries(par).sort((a,b)=>b[1]-a[1])) console.log(`  etat=${k} : ${v}  (${(100*v/vus).toFixed(1)} %)`);
}
main();
