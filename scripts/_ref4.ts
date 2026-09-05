import { google } from "googleapis";
const SITE="https://workwave.fr/";
const S="2026-08-05", E="2026-09-01";
function pat(u:string){
  const p=u.replace("https://workwave.fr","").split("?")[0];
  if(p==="/")return "/ (home)";
  if(p.startsWith("/artisan/"))return "/artisan/[slug]";
  if(p.startsWith("/guide-des-prix/"))return "/guide-des-prix/[slug]";
  if(p.startsWith("/trouver-des-chantiers/"))return "/trouver-des-chantiers";
  if(p.startsWith("/trouver-des-clients/"))return "/trouver-des-clients";
  if(p.startsWith("/blog/"))return "/blog/[slug]";
  if(p.startsWith("/ai/")||p.startsWith("/en/"))return "/ai|/en";
  if(p.startsWith("/barometre"))return "/barometre-*";
  const seg=p.split("/").filter(Boolean);
  if(seg.length===1)return "/[metier] (racine)";
  if(seg.length===2)return /-\d{2,3}$/.test(seg[1])?"/[metier]/[dept-NN]":"/[metier]/[ville]";
  if(seg.length===3)return "/[metier]/[specialite]/[ville]";
  return "autre";
}
async function main(){
  const auth=new google.auth.GoogleAuth({scopes:["https://www.googleapis.com/auth/webmasters.readonly"]});
  const sc=google.searchconsole({version:"v1",auth});
  let all:any[]=[];
  for(let start=0;start<300000;start+=25000){
    const r=await sc.searchanalytics.query({siteUrl:SITE,requestBody:{startDate:S,endDate:E,dimensions:["page"],rowLimit:25000,startRow:start}});
    const rows=r.data.rows||[]; all.push(...rows); if(rows.length<25000)break;
  }
  console.log(`fenetre ${S} -> ${E} (28 j) | pages avec impressions : ${all.length}`);
  const agg:Record<string,any>={};
  for(const r of all){const k=pat(r.keys![0]);agg[k]??={n:0,i:0,c:0,pw:0};agg[k].n++;agg[k].i+=r.impressions||0;agg[k].c+=r.clicks||0;agg[k].pw+=(r.position||0)*(r.impressions||0);}
  console.log("\ngabarit".padEnd(30)+"pages".padStart(8)+"impr".padStart(9)+"clics".padStart(7)+"pos".padStart(7)+"   CTR");
  for(const [k,v] of Object.entries(agg).sort((a:any,b:any)=>b[1].i-a[1].i))
    console.log(k.padEnd(30)+String(v.n).padStart(8)+String(v.i).padStart(9)+String(v.c).padStart(7)+(v.pw/Math.max(v.i,1)).toFixed(1).padStart(7)+"   "+(100*v.c/Math.max(v.i,1)).toFixed(2)+"%");

  // CTR par tranche, STRICTEMENT sur /[metier]/[ville]
  for (const cible of ["/[metier]/[ville]","TOUT SAUF artisan/guide/blog/ai (methode de l audit)"]) {
    const rows = cible==="/[metier]/[ville]"
      ? all.filter(r=>pat(r.keys![0])==="/[metier]/[ville]")
      : all.filter(r=>!/\/artisan\/|\/guide-des-prix\/|\/blog\/|\/ai\/|\/en\//.test(r.keys![0]));
    const b:Record<string,number[]>={"1-3":[0,0],"4-10":[0,0],"11-20":[0,0],"21+":[0,0]};
    for(const x of rows){const p=x.position||0;const k=p<=3?"1-3":p<=10?"4-10":p<=20?"11-20":"21+";b[k][0]+=x.impressions||0;b[k][1]+=x.clicks||0;}
    console.log(`\nCTR par tranche -- ${cible} (${rows.length} pages)`);
    for(const [k,[i,c]] of Object.entries(b))console.log(`  pos ${k.padEnd(6)} : ${String(i).padStart(7)} impr | ${String(c).padStart(5)} clics | CTR ${(100*c/Math.max(i,1)).toFixed(2)}%`);
  }
}
main().catch(e=>console.error(e));
