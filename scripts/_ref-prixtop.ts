import { google } from "googleapis";
const SITE="https://workwave.fr/";
const auth=new google.auth.GoogleAuth({scopes:["https://www.googleapis.com/auth/webmasters.readonly"]});
const sc=google.searchconsole({version:"v1",auth});
const q=async(b:any)=>((await sc.searchanalytics.query({siteUrl:SITE,requestBody:b})).data.rows||[]);
const RX=/\b(prix|tarif|co[uû]t|devis|combien)\b/i;
(async()=>{
  const rows=await q({startDate:"2026-08-01",endDate:"2026-08-31",dimensions:["query"],rowLimit:25000});
  const px=rows.filter(x=>RX.test(x.keys![0])&&(x.position||99)<=12).sort((a,b)=>(b.impressions||0)-(a.impressions||0));
  console.log(`=== Requetes PRIX ou l on est DEJA en top 12 (aout) : ${px.length} requetes ===`);
  const i=px.reduce((a,b)=>a+(b.impressions||0),0), c=px.reduce((a,b)=>a+(b.clicks||0),0);
  console.log(`   total ${i} impressions, ${c} clics -> CTR ${(i?100*c/i:0).toFixed(2)}%\n`);
  for(const r of px.slice(0,20)) console.log(`   pos ${(r.position||0).toFixed(1).padStart(4)} | ${String(r.impressions).padStart(4)} imp | ${r.clicks} clics | ${r.keys![0]}`);

  // Sur 3 mois glissants pour elargir l echantillon
  console.log("\n=== Meme mesure sur juin+juillet+aout (echantillon elargi) ===");
  const r3=await q({startDate:"2026-06-01",endDate:"2026-08-31",dimensions:["query"],rowLimit:25000});
  const p3=r3.filter(x=>RX.test(x.keys![0]));
  for(const [lo,hi,lab] of [[1,5,"1-5"],[5,10,"5-10"],[10,20,"10-20"],[20,99,"20+"]] as any){
    const s=p3.filter(x=>(x.position||0)>=lo&&(x.position||0)<hi);
    const ii=s.reduce((a:number,b:any)=>a+(b.impressions||0),0), cc=s.reduce((a:number,b:any)=>a+(b.clicks||0),0);
    console.log(`   PRIX pos ${lab.padEnd(5)} : ${String(s.length).padStart(4)} req | ${String(ii).padStart(5)} imp | ${cc} clics | CTR ${(ii?100*cc/ii:0).toFixed(2)}%`);
  }
})().catch(e=>{console.error(e.message);process.exit(1);});
