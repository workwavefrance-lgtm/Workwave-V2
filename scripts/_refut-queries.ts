import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-06-04", E = "2026-09-02";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  let all: any[] = [];
  for (let start = 0; start < 100000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: ["query"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || []; all.push(...rows);
    if (rows.length < 25000) break;
  }
  console.log(`requetes distinctes GSC ${S}->${E} : ${all.length}`);
  const hors = all.filter(r=>!/workwave|work wave/i.test(r.keys[0]));
  console.log(`dont hors marque : ${hors.length}`);
  for (const expr of ["leads qualifi", "lead qualifi", "leads artisan", "obtenir des leads", "leads btp"]) {
    const hit = hors.filter(r => r.keys[0].toLowerCase().includes(expr));
    console.log(`  "${expr}" -> ${hit.length} requete(s)` + (hit.length? " : "+hit.slice(0,5).map((h:any)=>`${h.keys[0]}(${h.impressions}imp)`).join(", "):""));
  }
  // en revanche, l intention PRO en langage artisan existe-t-elle deja ?
  console.log(`\n=== intention PRO en langage artisan (ce que l audit propose d ecrire) ===`);
  for (const expr of ["trouver des chantiers","trouver des clients","se faire connaitre","sans abonnement","apporteur d affaire","carnet de commande","trouver du travail"]) {
    const hit = hors.filter(r => r.keys[0].toLowerCase().includes(expr));
    const imp = hit.reduce((a:number,x:any)=>a+(x.impressions||0),0), clk = hit.reduce((a:number,x:any)=>a+(x.clicks||0),0);
    console.log(`  "${expr}" -> ${String(hit.length).padStart(3)} req | ${String(imp).padStart(5)} imp | ${clk} clics`);
    for (const h of hit.sort((a:any,b:any)=>(b.impressions||0)-(a.impressions||0)).slice(0,4))
      console.log(`        pos ${(h.position||0).toFixed(1).padStart(5)} | ${String(h.impressions).padStart(4)} imp | ${h.clicks} clics | ${h.keys[0]}`);
  }
}
main().catch(e=>{ console.error("ERR", e.response?.data?.error?.message ?? e.message); process.exit(1); });
