import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-06-04", E = "2026-09-02";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  // 1. TOUTES les requetes contenant "chantier"
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
    startDate: S, endDate: E, dimensions: ["query"], rowLimit: 25000,
    dimensionFilterGroups: [{ filters: [{ dimension: "query", operator: "contains", expression: "chantier" }] }] } });
  const rows = r.data.rows || [];
  const imp = rows.reduce((a,x)=>a+(x.impressions||0),0), clk = rows.reduce((a,x)=>a+(x.clicks||0),0);
  console.log(`=== TOUTES requetes contenant "chantier" ${S} -> ${E} ===`);
  console.log(`${rows.length} requetes | ${imp} impressions | ${clk} clics`);
  for (const x of rows.sort((a,b)=>(b.impressions||0)-(a.impressions||0)))
    console.log(`  pos ${(x.position||0).toFixed(1).padStart(5)} | ${String(x.impressions).padStart(4)} imp | ${String(x.clicks).padStart(2)} clics | ${x.keys![0]}`);
  // 2. Formes METIER vs SPECIALITE dans TOUT le corpus
  const all: any[] = [];
  for (let start = 0; start < 100000; start += 25000) {
    const rr = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 25000, startRow: start } });
    const q = rr.data.rows || []; all.push(...q); if (q.length < 25000) break;
  }
  console.log(`\nCorpus total : ${all.length} requetes distinctes`);
  const METIER = /(peintre|plombier|electricien|électricien|macon|maçon|couvreur|carreleur|menuisier|plaquiste|charpentier|serrurier|chauffagiste)/i;
  const SPE = /(peinture|plomberie|electricite|électricité|maconnerie|maçonnerie|couverture|carrelage|menuiserie|platrerie|plâtrerie|charpente|serrurerie|chauffage)/i;
  const ch = all.filter(x => /chantier/i.test(x.keys[0]));
  const m = ch.filter(x=>METIER.test(x.keys[0])), s = ch.filter(x=>SPE.test(x.keys[0]));
  const sum=(a:any[])=>[a.reduce((t,x)=>t+(x.impressions||0),0), a.reduce((t,x)=>t+(x.clicks||0),0)];
  console.log(`"chantier" + forme METIER    : ${m.length} req | ${sum(m)[0]} imp | ${sum(m)[1]} clics`);
  m.forEach(x=>console.log(`    pos ${(x.position||0).toFixed(1)} | ${x.impressions} imp | ${x.keys[0]}`));
  console.log(`"chantier" + forme SPECIALITE: ${s.length} req | ${sum(s)[0]} imp | ${sum(s)[1]} clics`);
  s.forEach(x=>console.log(`    pos ${(x.position||0).toFixed(1)} | ${x.impressions} imp | ${x.keys[0]}`));
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
