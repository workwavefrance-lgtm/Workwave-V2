import { google } from "googleapis";
const SITE="https://workwave.fr/";
const auth=new google.auth.GoogleAuth({scopes:["https://www.googleapis.com/auth/webmasters.readonly"]});
const sc=google.searchconsole({version:"v1",auth});
const q=async(b:any)=>((await sc.searchanalytics.query({siteUrl:SITE,requestBody:b})).data.rows||[]);
(async()=>{
  // CTR reel par tranche de position, dimension requete, aout
  const rows=await q({startDate:"2026-08-01",endDate:"2026-08-31",dimensions:["query"],rowLimit:25000});
  const bandes:[number,number,string][]=[[1,3,"1-3"],[3,5,"3-5"],[5,10,"5-10"],[10,15,"10-15"],[15,20,"15-20"],[20,30,"20-30"],[30,999,"30+"]];
  console.log("=== CTR REEL du site par tranche de position (aout, dimension requete) ===");
  for(const [lo,hi,lab] of bandes){
    const r=rows.filter(x=>(x.position||0)>=lo&&(x.position||0)<hi);
    const i=r.reduce((a,b)=>a+(b.impressions||0),0), c=r.reduce((a,b)=>a+(b.clicks||0),0);
    console.log(`  pos ${lab.padEnd(6)} : ${String(r.length).padStart(5)} requetes | ${String(i).padStart(6)} imp | ${String(c).padStart(5)} clics | CTR ${(i?100*c/i:0).toFixed(2)}%`);
  }
  // Meme chose en isolant les requetes NON-marque (le CTR global est dope par les recherches de nom d entreprise)
  console.log("\n=== idem, requetes NON-marque (hors nom d entreprise / workwave) ===");
  const RXprix=/\b(prix|tarif|co[uû]t|devis|combien)\b/i;
  for(const [lo,hi,lab] of bandes){
    const r=rows.filter(x=>(x.position||0)>=lo&&(x.position||0)<hi&&RXprix.test(x.keys![0]));
    const i=r.reduce((a,b)=>a+(b.impressions||0),0), c=r.reduce((a,b)=>a+(b.clicks||0),0);
    if(!r.length) continue;
    console.log(`  PRIX pos ${lab.padEnd(6)} : ${String(r.length).padStart(4)} req | ${String(i).padStart(5)} imp | ${c} clics | CTR ${(i?100*c/i:0).toFixed(2)}%`);
  }
})().catch(e=>{console.error(e.message);process.exit(1);});
