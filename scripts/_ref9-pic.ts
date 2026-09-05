import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const dump = async (s: string, e: string) => { const all: any[] = []; let off = 0;
    while (true) { const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: { startDate: s, endDate: e, dimensions: ["page"], rowLimit: 25000, startRow: off } });
      const rows = r.data.rows || []; if (!rows.length) break; all.push(...rows); off += rows.length; if (rows.length < 25000) break; } return all; };
  const B = [[1,3],[3,5],[5,10],[10,20],[20,50],[50,1000]];
  for (const [nom, s, e] of [["PIC semaine 20/07","2026-07-20","2026-07-26"],["RECENT semaine 24/08","2026-08-24","2026-08-30"]] as const) {
    const rows = await dump(s, e);
    const ti = rows.reduce((x,r)=>x+r.impressions,0), tc = rows.reduce((x,r)=>x+r.clicks,0);
    console.log(`\n=== ${nom} (${s} -> ${e}) : ${rows.length} pages | ${ti} imp | ${tc} clics | ${(tc/7).toFixed(0)} clics/j ===`);
    for (const [a,b] of B) { const sub = rows.filter(r=>r.position>=a&&r.position<b);
      const i = sub.reduce((x,r)=>x+r.impressions,0), c = sub.reduce((x,r)=>x+r.clicks,0);
      console.log(`  pos ${String(a).padStart(2)}-${String(b).padStart(4)} : ${String(sub.length).padStart(6)} pages | ${String(i).padStart(7)} imp (${(100*i/ti).toFixed(1).padStart(5)}%) | ${String(c).padStart(5)} clics (${(100*c/tc).toFixed(1).padStart(5)}%) | CTR ${(100*c/i).toFixed(2)}%`); }
  }
})();
