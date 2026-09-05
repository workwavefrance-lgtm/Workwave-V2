import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const D="/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/ctr";
(async () => {
  const sb = getServiceClient();
  const f = JSON.parse(fs.readFileSync(`${D}/fiches_join2.json`,"utf8")).filter((r:any)=>r.ea==="A").sort((a:any,b:any)=>b.i-a.i).slice(0,4000);
  const ids = [...new Set(f.map((r:any)=>r.ca))];
  const cids = [...new Set(f.map((r:any)=>r.ci))].filter(Boolean);
  const { data: cats } = await sb.from("categories").select("id,name").in("id", ids as number[]);
  const cmap = new Map((cats||[]).map((c:any)=>[c.id,c.name]));
  const vmap = new Map<number,string>();
  for (let i=0;i<cids.length;i+=300) { const { data } = await sb.from("cities").select("id,name").in("id", cids.slice(i,i+300) as number[]); for (const c of data||[]) vmap.set(c.id, c.name); }
  let cut=0, cutImp=0, tot=0, totImp=0; const lens:number[]=[];
  for (const r of f) {
    const t = `${r.nm} - ${cmap.get(r.ca)||""} à ${vmap.get(r.ci)||""} | Workwave.fr`;
    lens.push(t.length); tot++; totImp+=r.i;
    // seuil de troncature SERP ~ 60 caracteres ; la ville commence apres nom+cat
    const avantVille = `${r.nm} - ${cmap.get(r.ca)||""} à `.length;
    if (avantVille + (vmap.get(r.ci)||"").length > 60) { cut++; cutImp+=r.i; }
  }
  lens.sort((a,b)=>a-b);
  console.log(`titres fiche ouverte (4000 plus vues) : mediane ${lens[Math.floor(lens.length/2)]} car, p90 ${lens[Math.floor(lens.length*0.9)]}, max ${lens[lens.length-1]}`);
  console.log(`titres ou la VILLE depasse 60 caracteres (donc tronquee en SERP) : ${cut}/${tot} pages (${(100*cut/tot).toFixed(1)}%), ${cutImp}/${totImp} impressions (${(100*cutImp/totImp).toFixed(1)}%)`);
  console.log(`titres > 60 car au total : ${lens.filter(x=>x>60).length}/${tot}`);
})();
