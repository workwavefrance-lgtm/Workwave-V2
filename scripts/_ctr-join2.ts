import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const D="/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/ctr";
(async () => {
  const sb = getServiceClient();
  const rows = JSON.parse(fs.readFileSync(`${D}/fiches_join.json`, "utf8"));
  const slugs = rows.map((r:any)=>r.s);
  const map = new Map<string, any>();
  for (let i=0;i<slugs.length;i+=300) {
    let ok=false;
    for (let t=0;t<4 && !ok;t++) {
      try {
        const { data, error } = await sb.from("pros").select("slug,city_id,category_id,etat_admin,name").in("slug", slugs.slice(i,i+300)).abortSignal(AbortSignal.timeout(30000));
        if (error) throw new Error(error.message);
        for (const d of data||[]) map.set(d.slug, d);
        ok=true;
      } catch(e:any) { process.stderr.write(`retry ${i} (${e.message}) `); await new Promise(r=>setTimeout(r,3000)); }
    }
    if (i % 15000 === 0) process.stderr.write(`${i} `);
  }
  const out = rows.map((r:any)=>{ const d=map.get(r.s); return d?{...r, ci:d.city_id, ca:d.category_id, nm:d.name}:r; });
  fs.writeFileSync(`${D}/fiches_join2.json`, JSON.stringify(out));
  console.log("ok", map.size);
})();
