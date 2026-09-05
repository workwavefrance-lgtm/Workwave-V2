import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const PAGE=1000; let off=0; const all:any[]=[];
  while (true) {
    const { data, error } = await sb.from("price_guides").select("slug,scope,status,metier_slug").range(off,off+PAGE-1);
    if (error) { console.error(error.message); process.exit(1); }
    const r = data||[]; if (!r.length) break; all.push(...r); off += r.length;
  }
  const cross: Record<string,number> = {};
  for (const g of all) { const k = `scope=${g.scope} / status=${g.status}`; cross[k]=(cross[k]||0)+1; }
  console.log("=== crosstab scope x status ===");
  for (const [k,v] of Object.entries(cross).sort((a,b)=>b[1]-a[1])) console.log(`  ${k.padEnd(42)} ${v}`);
  const nonPub = all.filter(g=>g.status!=="published");
  console.log(`\nGuides NON published : ${nonPub.length}`);
  for (const g of nonPub.slice(0,12)) console.log(`  [${g.status}] scope=${g.scope} ${g.slug}`);
})().catch(e=>{console.error(e.message);process.exit(1);});
