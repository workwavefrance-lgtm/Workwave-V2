import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
import fs from "fs";
const sb = getServiceClient();
(async () => {
  const t0 = Date.now();
  const { data, error } = await sb.rpc("barometre_cat_dept");
  console.log("barometre_cat_dept :", error ? "erreur " + error.message : `${(data as any[]).length} lignes en ${((Date.now()-t0)/1000).toFixed(1)} s`);
  if (error) return;
  const rows = data as any[];
  fs.writeFileSync("/tmp/barometre_cat_dept.json", JSON.stringify(rows));
  const { data: cats } = await sb.from("categories").select("slug, vertical");
  const vert = new Map((cats||[]).map((c:any)=>[c.slug,c.vertical]));
  for (const v of ["btp","domicile","personne"]) {
    const s = rows.filter((r)=>vert.get(r.c)===v);
    const plateau = s.filter((r)=>{const m=r.n%1000; return r.n>=900 && (m>=900||m===0);});
    console.log(`\n${v} : ${s.length} couples metier x dept · ${s.filter((r)=>r.n>=900).length} avec >= 900 fiches actives`);
    console.log(`  couples colles juste sous un millier : ${plateau.length}`);
    for (const r of plateau.sort((a,b)=>b.n-a.n).slice(0,12)) console.log(`    ${r.c.padEnd(24)} dept ${String(r.d).padStart(3)} : ${String(r.n).padStart(5)}`);
  }
})();
