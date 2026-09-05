import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const R = { s: "2026-08-05", e: "2026-09-01" };
const P = { s: "2026-07-08", e: "2026-08-04" };
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const all = async (body: any) => {
    const rows: any[] = []; let start = 0;
    while (true) {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { ...body, rowLimit: 25000, startRow: start } });
      const got = r.data.rows || []; rows.push(...got);
      if (got.length === 0) break;
      start += got.length;
      if (start >= 200000) break;
    }
    return rows;
  };
  const tot = (rs: any[]) => { const imp = rs.reduce((a, r) => a + r.impressions, 0);
    return { n: rs.length, imp, cl: rs.reduce((a, r) => a + r.clicks, 0), pos: rs.reduce((a, r) => a + r.position * r.impressions, 0) / Math.max(1, imp) }; };
  const f = (t: any) => `${t.n} lignes | ${t.imp} imp | ${t.cl} clics | pos ${t.pos.toFixed(1)} | CTR ${(100*t.cl/Math.max(1,t.imp)).toFixed(2)}%`;

  const qR = await all({ startDate: R.s, endDate: R.e, dimensions: ["query"] });
  const qP = await all({ startDate: P.s, endDate: P.e, dimensions: ["query"] });
  const RX = /\bprix\b|\btarif|combien (ca|ça) co|coût|au m2|au m²/i;
  console.log(`REQUETES recent    : ${f(tot(qR))}`);
  console.log(`REQUETES precedent : ${f(tot(qP))}`);
  console.log(`PRIX recent        : ${f(tot(qR.filter(r=>RX.test(r.keys[0]))))}`);
  console.log(`PRIX precedent     : ${f(tot(qP.filter(r=>RX.test(r.keys[0]))))}`);

  const pR = await all({ startDate: R.s, endDate: R.e, dimensions: ["page"] });
  const pP = await all({ startDate: P.s, endDate: P.e, dimensions: ["page"] });
  const gp = (rs: any[]) => rs.filter((r) => r.keys[0].includes("/guide-des-prix/"));
  console.log(`\nTOUTES PAGES recent    : ${f(tot(pR))}`);
  console.log(`TOUTES PAGES precedent : ${f(tot(pP))}`);
  console.log(`/guide-des-prix/ recent    : ${f(tot(gp(pR)))}`);
  console.log(`/guide-des-prix/ precedent : ${f(tot(gp(pP)))}`);
  const evo = (a:number,b:number)=> b? `${(100*(a-b)/b).toFixed(0)}%` : "n/a";
  console.log(`evolution clics /guide-des-prix/ : ${evo(tot(gp(pR)).cl, tot(gp(pP)).cl)}  | evolution clics SITE (pages) : ${evo(tot(pR).cl, tot(pP).cl)}`);
  console.log(`evolution imp  /guide-des-prix/ : ${evo(tot(gp(pR)).imp, tot(gp(pP)).imp)} | evolution imp SITE (pages) : ${evo(tot(pR).imp, tot(pP).imp)}`);
  console.log(`\nTop 15 /guide-des-prix/ par impressions (28j recents) :`);
  for (const r of gp(pR).sort((a,b)=>b.impressions-a.impressions).slice(0,15))
    console.log(`  ${String(r.impressions).padStart(4)}i ${String(r.clicks).padStart(2)}c pos ${r.position.toFixed(1).padStart(5)} | ${r.keys[0].replace("https://workwave.fr","")}`);
}
main().catch((e) => { console.error("ERREUR", e?.response?.data?.error?.message || e.message); process.exit(1); });
