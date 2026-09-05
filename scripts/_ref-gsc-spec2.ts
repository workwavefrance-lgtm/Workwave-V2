import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  const KNOWN = new Set(["artisan","guide-des-prix","trouver-des-chantiers","trouver-des-clients","blog","ai","en","recherche","pro","deposer-projet","departements","verifier-artisan","avis","enquete-pro","feedback","barometre-artisans","barometre-prix-artisans","a-propos","cgu","cgv","mentions-legales"]);
  const agg: Record<string,{n:number;imp:number;clicks:number}> = {};
  const specRows:any[]=[];
  let start=0, total=0;
  for (let p=0;p<8;p++){
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate:S,endDate:E,dimensions:["page"],rowLimit:25000,startRow:start } });
    const rows = r.data.rows||[];
    if (!rows.length) break;
    total += rows.length; start += rows.length;
    for (const row of rows) {
      const segs = new URL((row.keys||[])[0] as string).pathname.split("/").filter(Boolean);
      let type:string;
      if (segs.length===0) type="home";
      else if (segs.length===3 && !KNOWN.has(segs[0])) { type="SPEC"; specRows.push(row); }
      else if (segs.length===2 && !KNOWN.has(segs[0])) type="metier/lieu";
      else if (segs.length===1 && !KNOWN.has(segs[0])) type="metier racine";
      else type=segs[0];
      agg[type] ||= {n:0,imp:0,clicks:0};
      agg[type].n++; agg[type].imp+=row.impressions||0; agg[type].clicks+=row.clicks||0;
    }
    if (rows.length<25000) break;
  }
  console.log(`TOTAL lignes pages recuperees: ${total}  (${S} -> ${E})`);
  console.log("\nTYPE | pages distinctes avec >=1 impression | impressions | clics");
  for (const [t,v] of Object.entries(agg).sort((a,b)=>b[1].imp-a[1].imp))
    console.log(`${t.padEnd(22)} ${String(v.n).padStart(7)} ${String(v.imp).padStart(9)} ${String(v.clicks).padStart(7)}`);
  const specImp = specRows.reduce((s,r)=>s+(r.impressions||0),0);
  const specClk = specRows.reduce((s,r)=>s+(r.clicks||0),0);
  console.log(`\nSPEC: ${specRows.length} pages distinctes vues en recherche, ${specImp} impressions, ${specClk} clics sur 28 jours`);
  console.log(`SPEC clics/jour = ${(specClk/28).toFixed(3)}`);
}
main();
