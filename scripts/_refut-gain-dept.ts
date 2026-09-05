/** REFUTATION : le gain de 20 clics/jour sur les listings departement. */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  // 1. combien d'URL cat x dept sont reellement declarees au sitemap 1 ?
  const x = await (await fetch("https://workwave.fr/sitemap/1.xml")).text();
  const urls = (x.match(/<loc>([^<]+)<\/loc>/g)||[]).map(m=>m.replace(/<\/?loc>/g,"").replace("https://workwave.fr",""));
  console.log(`URL cat x dept declarees au sitemap/1.xml : ${urls.length}`);

  // 2. contenus redactionnels metier_dept en base
  const { count: nbSeo } = await sb.from("seo_pages").select("*",{count:"exact",head:true})
    .eq("type","metier_dept").not("content","is",null);
  const { count: nbSeoTot } = await sb.from("seo_pages").select("*",{count:"exact",head:true}).eq("type","metier_dept");
  console.log(`seo_pages type=metier_dept : ${nbSeoTot} lignes, dont ${nbSeo} avec un content non nul`);

  // 3. distribution reelle des clics sur les listings dept (GSC 28j)
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const fin = new Date(Date.now()-3*864e5).toISOString().slice(0,10), debut = new Date(Date.now()-31*864e5).toISOString().slice(0,10);
  const dept: {u:string;imp:number;clics:number;pos:number}[] = []; let start=0;
  while (true) {
    const { data } = await sc.searchanalytics.query({ siteUrl:"https://workwave.fr/", requestBody:{
      startDate:debut, endDate:fin, dimensions:["page"], rowLimit:25000, startRow:start } });
    const rows = data.rows||[]; if(!rows.length)break;
    for (const r of rows) { const p=r.keys![0].replace("https://workwave.fr","");
      const s=p.split("/").filter(Boolean);
      if (s.length===2 && /-\d{2,3}$/.test(s[1]) && !p.startsWith("/ai/"))
        dept.push({u:p,imp:r.impressions||0,clics:r.clicks||0,pos:r.position||0}); }
    start+=rows.length; if(rows.length<25000)break;
  }
  dept.sort((a,b)=>b.clics-a.clics);
  const totC = dept.reduce((s,d)=>s+d.clics,0), totI = dept.reduce((s,d)=>s+d.imp,0);
  console.log(`\nlistings dept visibles : ${dept.length} pages · ${totI} impressions · ${totC} clics/28j`);
  console.log(`rendement moyen : ${(totC/dept.length/28).toFixed(4)} clics/page/jour`);
  let cum=0, i=0; for(;i<dept.length;i++){cum+=dept[i].clics; if(cum>=totC*0.5)break;}
  console.log(`la MOITIE des clics vient de ${i+1} pages (${((i+1)/dept.length*100).toFixed(1)} % des pages visibles)`);
  const zero = dept.filter(d=>d.clics===0).length;
  console.log(`pages visibles a ZERO clic : ${zero} / ${dept.length} (${(zero/dept.length*100).toFixed(1)} %)`);
  console.log(`\ntop 8 :`); dept.slice(0,8).forEach(d=>console.log(`  ${d.clics.toString().padStart(3)} clics · ${d.imp.toString().padStart(5)} imp · pos ${d.pos.toFixed(1).padStart(5)} · ${d.u}`));
  // mediane des impressions des pages visibles
  const imps = dept.map(d=>d.imp).sort((a,b)=>a-b);
  console.log(`\nimpressions par page visible : mediane ${imps[Math.floor(imps.length/2)]}, moyenne ${(totI/dept.length).toFixed(1)}`);
})();
