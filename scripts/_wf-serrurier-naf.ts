import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main() {
  for (const [id, slug] of [[11,"serrurier"],[13,"climaticien"],[37,"vitrier"]] as [number,string][]) {
    const parNaf = new Map<string, number>();
    let offset = 0;
    while (true) {
      const { data, error } = await sb.from("pros").select("naf_code, source")
        .eq("category_id", id).range(offset, offset + 999);
      if (error) { console.log(slug, "ERREUR", error.message); break; }
      const rows = data || [];
      if (rows.length === 0) break;
      for (const r of rows) parNaf.set(r.naf_code ?? "NULL", (parNaf.get(r.naf_code ?? "NULL") || 0) + 1);
      offset += rows.length;
    }
    const tot = [...parNaf.values()].reduce((a,b)=>a+b,0);
    console.log(`${slug} : ${tot} fiches, naf_code =`, [...parNaf.entries()].sort((a,b)=>b[1]-a[1]));
  }
}
main();
