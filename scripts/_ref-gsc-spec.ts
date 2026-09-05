import { google } from "googleapis";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-05", E = "2026-09-01";
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
    startDate: S, endDate: E, dimensions: ["page"], rowLimit: 25000 } });
  const rows = r.data.rows || [];
  console.log("lignes pages retournees:", rows.length, `(${S} -> ${E})`);
  const KNOWN = new Set(["artisan","guide-des-prix","trouver-des-chantiers","trouver-des-clients","blog","ai","en","recherche","pro","deposer-projet","departements","verifier-artisan","avis","enquete-pro","feedback"]);
  const agg: Record<string,{n:number;imp:number;clicks:number;pos:number}> = {};
  const specRows: any[] = [];
  for (const row of rows) {
    const u = new URL((row.keys||[])[0] as string);
    const segs = u.pathname.split("/").filter(Boolean);
    let type: string;
    if (segs.length===0) type="home";
    else if (segs.length===3 && !KNOWN.has(segs[0])) { type="SPEC metier/spec/ville"; specRows.push(row); }
    else if (segs.length===2 && !KNOWN.has(segs[0])) type="metier/lieu";
    else if (segs.length===1 && !KNOWN.has(segs[0])) type="metier racine";
    else type = segs[0];
    agg[type] ||= {n:0,imp:0,clicks:0,pos:0};
    agg[type].n++; agg[type].imp += row.impressions||0; agg[type].clicks += row.clicks||0;
    agg[type].pos += (row.position||0)*(row.impressions||0);
  }
  console.log("\nTYPE | pages avec impressions | impressions | clics | position ponderee");
  for (const [t,v] of Object.entries(agg).sort((a,b)=>b[1].imp-a[1].imp))
    console.log(`${t.padEnd(28)} ${String(v.n).padStart(6)} ${String(v.imp).padStart(8)} ${String(v.clicks).padStart(6)}   ${(v.imp? v.pos/v.imp:0).toFixed(1)}`);
  console.log("\n--- Top 15 pages SPEC par impressions ---");
  specRows.sort((a,b)=>(b.impressions||0)-(a.impressions||0));
  for (const row of specRows.slice(0,15))
    console.log(`  ${String(row.impressions).padStart(5)} imp | ${String(row.clicks).padStart(3)} clics | pos ${(row.position||0).toFixed(1)} | ${(row.keys||[])[0]}`);
}
main();
