import fs from "fs";
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const { treated: tArr, cities: cArr } = JSON.parse(fs.readFileSync("/tmp/treated.json","utf8"));
const treated = new Set<string>(tArr), tCities = new Set<string>(cArr);
const PRF = ["artisan","guide-des-prix","blog","trouver-des-chantiers","trouver-des-clients","ai","en","pro"];
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes:["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version:"v1", auth });
  let all:any[]=[];
  for (let s=0;s<150000;s+=25000){
    const r = await sc.searchanalytics.query({ siteUrl:SITE, requestBody:{ startDate:"2026-08-05", endDate:"2026-09-01", dimensions:["page"], rowLimit:25000, startRow:s }});
    const rows=r.data.rows||[]; all.push(...rows); if(rows.length<25000) break;
  }
  const bands=[[0,15],[15,25],[25,35],[35,60],[60,999]];
  const mk=()=>bands.map(()=>({i:0,c:0,n:0}));
  const tb=mk(), ub=mk();
  const tot={t:{i:0,c:0,n:0,pw:0},u:{i:0,c:0,n:0,pw:0}};
  for (const r of all) {
    const p = String(r.keys![0]).replace("https://workwave.fr","");
    const sg = p.split("/").filter(Boolean);
    if (sg.length!==2 || /-\d{2,3}$/.test(sg[1]) || PRF.includes(sg[0]) || sg[0].startsWith("barometre")) continue;
    const isT = treated.has(p);
    const g = isT ? tot.t : tot.u;
    g.i+=r.impressions||0; g.c+=r.clicks||0; g.n++; g.pw+=(r.position||0)*(r.impressions||0);
    const bi = bands.findIndex(([a,b])=>(r.position||0)>=a && (r.position||0)<b); if(bi<0) continue;
    const d = isT ? tb[bi] : ub[bi];
    d.i+=r.impressions||0; d.c+=r.clicks||0; d.n++;
  }
  const f=(x:any)=> x.i? `${((100*x.c)/x.i).toFixed(2)}%  (${x.c} clics / ${x.i} impr, ${x.n} pages)` : "aucune impression";
  console.log("/[metier]/[ville], 05/08 -> 01/09\n");
  console.log("GLOBAL");
  console.log("  AVEC etoiles :", f(tot.t), " pos.moy", (tot.t.pw/Math.max(tot.t.i,1)).toFixed(1));
  console.log("  SANS etoiles :", f(tot.u), " pos.moy", (tot.u.pw/Math.max(tot.u.i,1)).toFixed(1));
  console.log("\nA POSITION COMPARABLE");
  bands.forEach(([a,b],k)=>{
    console.log(`  pos ${a}-${b}`);
    console.log("     AVEC :", f(tb[k]));
    console.log("     SANS :", f(ub[k]));
  });
}
main().catch(e=>console.error(e.message));
