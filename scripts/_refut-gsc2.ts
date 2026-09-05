import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes:["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version:"v1", auth: await auth.getClient() as any });
  const site="https://workwave.fr/", start="2026-08-04", end="2026-09-02";
  const rows:any[]=[]; let startRow=0;
  while(true){
    const r = await sc.searchanalytics.query({ siteUrl:site, requestBody:{
      startDate:start,endDate:end,dimensions:["page"],rowLimit:25000,startRow }});
    const d=r.data.rows||[]; if(!d.length) break; rows.push(...d); startRow+=d.length;
    if(d.length<25000) break;
  }
  console.log(`fenetre ${start} -> ${end} (30 j) : ${rows.length} pages avec impressions (pagination complete)`);
  const isDept=(u:string)=>/^https:\/\/workwave\.fr\/[^/]+\/[a-z0-9-]+-\d{2,3}$/.test(u);
  const isVille=(u:string)=>/^https:\/\/workwave\.fr\/[^/]+\/[a-z0-9-]+$/.test(u)&&!isDept(u);
  const isArtisan=(u:string)=>u.startsWith("https://workwave.fr/artisan/");
  const agg=(lbl:string,f:(u:string)=>boolean)=>{let c=0,i=0,n=0,ps=0;
    for(const r of rows){const u=r.keys[0]; if(!f(u))continue; c+=r.clicks;i+=r.impressions;n++;ps+=r.position*r.impressions;}
    console.log(`${lbl.padEnd(16)} ${String(n).padStart(6)} pages | ${String(i).padStart(7)} impr | ${String(c).padStart(6)} clics | pos ${(i?ps/i:0).toFixed(1)} | CTR ${(100*c/Math.max(i,1)).toFixed(2)}%`);
    return {n,i,c,pos:i?ps/i:0};};
  const d=agg("metier x DEPT",isDept);
  const v=agg("metier x VILLE",isVille);
  agg("artisan",isArtisan);
  const tot=rows.reduce((a,r)=>({c:a.c+r.clicks,i:a.i+r.impressions}),{c:0,i:0});
  console.log(`TOTAL SITE       ${String(rows.length).padStart(6)} pages | ${String(tot.i).padStart(7)} impr | ${String(tot.c).padStart(6)} clics (${(tot.c/30).toFixed(0)}/j)`);
  console.log(`\nAUDIT annoncait : 1907 pages dept, 13091 impr/mois, 209 clics, pos 26,2 ; 22111 pages ville`);
  console.log(`MESURE          : ${d.n} pages dept, ${d.i} impr, ${d.c} clics, pos ${d.pos.toFixed(1)} ; ${v.n} pages ville`);
})().catch(e=>{console.error(e.message);process.exit(1);});
