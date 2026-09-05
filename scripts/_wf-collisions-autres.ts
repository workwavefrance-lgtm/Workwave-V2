import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main() {
  for (const v of ["domicile","personne"]) {
    const { data } = await sb.from("categories").select("id, slug, naf_codes, vertical").eq("vertical", v);
    const cats = data || [];
    console.log(`\n=== ${v} : ${cats.length} categories, ordre renvoye : ${cats.map(c=>c.id).join(",")}`);
    const parNaf = new Map<string, {id:number,slug:string}[]>();
    for (const c of cats) for (const n of (c.naf_codes||[])) {
      if (!parNaf.has(n)) parNaf.set(n, []);
      parNaf.get(n)!.push({id:c.id, slug:c.slug});
    }
    for (const [naf, l] of parNaf) if (l.length>1) console.log(`   collision ${naf} : ${l.map(x=>`${x.slug}(${x.id})`).join(" , ")}`);
  }
}
main();
