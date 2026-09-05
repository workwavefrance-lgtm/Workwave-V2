import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data, error } = await sb.from("categories")
    .select("id, slug, naf_codes, vertical")
    .in("vertical", ["btp", "domicile", "personne"]).order("id");
  if (error) { console.log("ERR", error.message); return; }
  const parNaf = new Map<string, {id:number,slug:string}[]>();
  for (const c of data as any[]) {
    for (const n of (c.naf_codes || [])) {
      if (!parNaf.has(n)) parNaf.set(n, []);
      parNaf.get(n)!.push({ id: c.id, slug: c.slug });
    }
  }
  console.log("Categories BTP/domicile/personne :", data!.length);
  console.log("\nNAF partages par PLUSIEURS categories (le 2e perd tout, upsert ignore_duplicates) :");
  let n = 0;
  for (const [naf, cats] of [...parNaf.entries()].sort()) {
    if (cats.length > 1) {
      n++;
      const tri = cats.sort((a,b)=>a.id-b.id);
      console.log(`  ${naf} -> ${tri.map(c=>`${c.slug}(${c.id})`).join(" , ")}   [gagnant probable: ${tri[0].slug}]`);
    }
  }
  console.log("\nTotal NAF en collision :", n);
})();
