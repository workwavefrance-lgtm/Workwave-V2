import { google } from "googleapis";
const SITE="https://workwave.fr/";
const auth=new google.auth.GoogleAuth({scopes:["https://www.googleapis.com/auth/webmasters.readonly"]});
const sc=google.searchconsole({version:"v1",auth});
const q=async(b:any)=>((await sc.searchanalytics.query({siteUrl:SITE,requestBody:b})).data.rows||[]);
const RX=/\b(prix|tarif|co[uû]t|devis|combien)\b/i;
(async()=>{
  const pq=await q({startDate:"2026-08-01",endDate:"2026-08-31",dimensions:["page","query"],rowLimit:25000});
  const prixQ=pq.filter(r=>RX.test(r.keys![1]));
  const chevauche=prixQ.filter(r=>r.keys![0].includes("/guide-des-prix/"));
  const impPrix=5678, impGuides=4628;
  const impChev=chevauche.reduce((a,b)=>a+(b.impressions||0),0);
  console.log("=== DOUBLE COMPTE dans le calcul de gain de l audit ===");
  console.log(`  intention prix (requetes)          : ${impPrix} imp`);
  console.log(`  guides /guide-des-prix/ (pages)    : ${impGuides} imp`);
  console.log(`  INTERSECTION (guides sur req prix) : ${impChev} imp`);
  console.log(`  somme naive de l audit             : ${impPrix+impGuides} imp`);
  console.log(`  union reelle                       : ${impPrix+impGuides-impChev} imp`);
  console.log(`  -> inflation de la base : +${(100*impChev/(impPrix+impGuides-impChev)).toFixed(0)}%\n`);

  // CTR reel prix sur 3 mois par bande, pour rebattre le gain
  const r3=await q({startDate:"2026-06-01",endDate:"2026-08-31",dimensions:["query"],rowLimit:25000});
  const p3=r3.filter(x=>RX.test(x.keys![0]));
  const band=(lo:number,hi:number)=>{const s=p3.filter(x=>(x.position||0)>=lo&&(x.position||0)<hi);
    const i=s.reduce((a,b)=>a+(b.impressions||0),0),c=s.reduce((a,b)=>a+(b.clicks||0),0);return{i,c,ctr:i?c/i:0};};
  const b15=band(1,5), b510=band(5,10), b1020=band(10,20);
  console.log("=== CTR PRIX REEL (3 mois) vs hypothese de l audit ===");
  console.log(`  pos 1-5   : ${b15.i} imp, ${b15.c} clics -> CTR ${(100*b15.ctr).toFixed(2)}%`);
  console.log(`  pos 5-10  : ${b510.i} imp, ${b510.c} clics -> CTR ${(100*b510.ctr).toFixed(2)}%   (audit suppose 2,50% en pos 10)`);
  console.log(`  pos 10-20 : ${b1020.i} imp, ${b1020.c} clics -> CTR ${(100*b1020.ctr).toFixed(2)}%   (audit suppose 1,20% en pos 15)\n`);

  const union=impPrix+impGuides-impChev;
  console.log("=== GAIN RECALCULE sur la base union et le CTR mesure ===");
  for(const [lab,ctr] of [["optimiste : 1/3 de la base en pos 1-5, CTR mesure 1,32%",0.0132],
                          ["realiste  : 1/3 de la base en pos 5-15, CTR mesure ~0,05%",0.0005]] as any){
    const clicsMois=(union/3)*ctr;
    console.log(`  ${lab} -> ${clicsMois.toFixed(1)} clics/mois = ${(clicsMois/30).toFixed(2)} clics/jour`);
  }
  console.log(`\n  Gain annonce par l audit : 5 clics/jour = 150 clics/mois`);
})().catch(e=>{console.error(e.message);process.exit(1);});
