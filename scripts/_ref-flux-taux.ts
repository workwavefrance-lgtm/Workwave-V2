import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const j=(d:Date)=>d.toISOString().slice(0,10);
(async()=>{
  const auth=new google.auth.GoogleAuth({scopes:["https://www.googleapis.com/auth/webmasters.readonly"]});
  const sc=google.searchconsole({version:"v1",auth:(await auth.getClient()) as never});
  const site="https://workwave.fr/";
  const fin=j(new Date(Date.now()-3*86400e3)), deb=j(new Date(Date.now()-31*86400e3));
  let rows:any[]=[],start=0;
  while(true){const {data}=await sc.searchanalytics.query({siteUrl:site,requestBody:{startDate:deb,endDate:fin,dimensions:["page"],rowLimit:25000,startRow:start}});
    const r=data.rows||[];rows.push(...r);if(r.length<25000)break;start+=r.length;if(start>150000)break;}
  const est=(u:string)=>{const p=u.replace("https://workwave.fr","");const s=p.split("/").filter(Boolean);
    return s.length===2 && !p.startsWith("/artisan/") && !p.startsWith("/guide-des-prix") && !p.startsWith("/trouver-des-chantiers") && !p.startsWith("/blog") && !p.startsWith("/ai");};
  const L=rows.filter(r=>est(r.keys![0]));
  const clics=L.reduce((a,r)=>a+(r.clicks||0),0);
  const avecClic=L.filter(r=>(r.clicks||0)>0);
  console.log("LISTINGS metier/lieu, 28 jours");
  console.log(`  pages avec >=1 impression        : ${L.length}`);
  console.log(`  clics totaux                     : ${clics}`);
  console.log(`  clics/page/jour (toutes pages)   : ${(clics/L.length/28).toFixed(5)}`);
  console.log(`  pages avec >=1 clic              : ${avecClic.length}`);
  console.log(`  clics/page/jour (pages a clics)  : ${(clics/avecClic.length/28).toFixed(5)}   <= le 0,0263 de l audit vient d ici`);
  console.log(`  clics/page/jour rapporte a 28j sur pages a clics, non annualise : ${(clics/avecClic.length).toFixed(3)} clic/page sur 28 j`);
})();
