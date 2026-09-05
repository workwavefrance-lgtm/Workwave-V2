import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const D="/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/ctr";
(async () => {
  const sb = getServiceClient();
  const f = JSON.parse(fs.readFileSync(`${D}/fiches_join2.json`,"utf8")).filter((r:any)=>r.ea==="A").sort((a:any,b:any)=>b.i-a.i).slice(0,4000);
  const imp = new Map<string,number>(f.map((r:any)=>[r.s, r.i]));
  const slugs = f.map((r:any)=>r.s);
  console.log("fiches OUVERTES avec impressions :", slugs.length, "imp:", f.reduce((a:number,x:any)=>a+x.i,0));
  const acc:any = {}; const accImp:any = {}; let n=0, ni=0;
  for (let i=0;i<slugs.length;i+=300) {
    let ok=false;
    for (let t=0;t<4&&!ok;t++){ try {
      const { data, error } = await sb.from("pros").select("slug,founded_year,description,description_ai,forme_juridique,naf_code,postal_code,effectif_range,sirene_enrichi_at,rge_certified")
        .in("slug", slugs.slice(i,i+300)).abortSignal(AbortSignal.timeout(30000));
      if (error) throw new Error(error.message);
      for (const d of data||[]) { n++; const w = imp.get(d.slug)||0; ni+=w;
        for (const k of ["founded_year","description","description_ai","forme_juridique","naf_code","postal_code","effectif_range","sirene_enrichi_at","rge_certified"]) {
          const v=(d as any)[k]; const has = k==="effectif_range" ? (v && v!=="NN") : (k==="rge_certified" ? v===true : !!v);
          if (has) { acc[k]=(acc[k]||0)+1; accImp[k]=(accImp[k]||0)+w; } } }
      ok=true; } catch(e:any){ await new Promise(r=>setTimeout(r,2000)); } }
  }
  console.log(`\nchamp                 %pages   %impressions`);
  for (const k of Object.keys(acc).sort((a,b)=>accImp[b]-accImp[a]))
    console.log(`${k.padEnd(20)} ${(100*acc[k]/n).toFixed(1).padStart(6)}%  ${(100*accImp[k]/ni).toFixed(1).padStart(6)}%`);
  console.log(`base : ${n} pages, ${ni} impressions`);
})();
