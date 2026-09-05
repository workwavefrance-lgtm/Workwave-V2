import { google } from "googleapis"; import fs from "fs";
const SITE = "https://workwave.fr/";
(async () => {
  const villes = new Set(fs.readFileSync(process.argv[2],"utf8").split("\n").map(s=>s.trim()).filter(Boolean));
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  let start=0; const rows:any[]=[];
  while(true){ const r=await sc.searchanalytics.query({siteUrl:SITE,requestBody:{startDate:"2026-08-05",endDate:"2026-09-01",dimensions:["page"],rowLimit:25000,startRow:start}}); const g=r.data.rows||[]; rows.push(...g); if(g.length<25000)break; start+=g.length; }
  const spec = rows.filter(r=>{const p=new URL(r.keys[0]).pathname.split("/").filter(Boolean); return p.length===3 && !["artisan","ai","en","blog","guide-des-prix","trouver-des-chantiers","trouver-des-clients"].includes(p[0]);});
  console.log("LES 14 PAGES SPECIALITE DE LA POPULATION DU SITEMAP/3 (95 grandes villes) :");
  for (const r of spec.filter(r=>villes.has(new URL(r.keys[0]).pathname.split("/").filter(Boolean)[2].split("?")[0])).sort((a,b)=>(a.position||0)-(b.position||0)))
    console.log(`   pos ${(r.position||0).toFixed(1).padStart(5)} | ${String(r.impressions).padStart(4)} imp | ${r.clicks} clics | ${new URL(r.keys[0]).pathname}`);
})();
