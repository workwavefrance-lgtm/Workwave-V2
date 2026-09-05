import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S="2026-08-01", E="2026-08-31";
function fam(u: string): string {
  const p = u.replace("https://workwave.fr","").split("?")[0];
  if (p==="/"||p==="") return "/ (home)";
  if (p.startsWith("/artisan/")) return "/artisan/[slug]";
  if (p.startsWith("/guide-des-prix/")) return "/guide-des-prix/[slug]";
  if (p.startsWith("/trouver-des-chantiers")) return "/trouver-des-chantiers/*";
  if (p.startsWith("/trouver-des-clients")) return "/trouver-des-clients/*";
  if (p.startsWith("/blog")) return "/blog/*";
  if (p.startsWith("/barometre")) return "/barometre-*";
  if (p.startsWith("/ai/")||p.startsWith("/en/")) return "/ai|/en";
  if (p.startsWith("/pro")) return "/pro*";
  const seg=p.split("/").filter(Boolean);
  if (seg.length===1) return "/[metier] (racine)";
  if (seg.length===2) return /-\d{2,3}$/.test(seg[1]) ? "/[metier]/[dept]" : "/[metier]/[ville]";
  if (seg.length===3) return "/[metier]/[specialite]/[ville]";
  return "autre";
}
async function main(){
  const auth=new google.auth.GoogleAuth({scopes:["https://www.googleapis.com/auth/webmasters.readonly"]});
  const sc=google.searchconsole({version:"v1",auth});
  const agg=new Map<string,{c:number;i:number;n:number;ps:number}>(); let start=0;
  while(true){
    const r=await sc.searchanalytics.query({siteUrl:SITE,requestBody:{startDate:S,endDate:E,dimensions:["page"],rowLimit:25000,startRow:start}});
    const rows=r.data.rows||[]; if(!rows.length) break;
    for(const row of rows){const f=fam(row.keys![0]);const a=agg.get(f)||{c:0,i:0,n:0,ps:0};
      a.c+=row.clicks||0;a.i+=row.impressions||0;a.n++;a.ps+=(row.position||0)*(row.impressions||0);agg.set(f,a);}
    start+=rows.length; if(rows.length<25000) break;
  }
  console.log(`=== ${S} -> ${E} : familles (pagination complete) ===`);
  for(const [f,a] of [...agg].sort((x,y)=>y[1].i-x[1].i))
    console.log(`${String(a.i).padStart(7)} imp | ${String(a.c).padStart(5)} clics | ${String(a.n).padStart(6)} pages | pos ${(a.ps/Math.max(a.i,1)).toFixed(1)} | ${f}`);
}
main().catch(e=>{console.error(e.message);process.exit(1);});
