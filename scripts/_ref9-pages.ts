import { google } from "googleapis";
import fs from "fs";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const dump = async (start: string, end: string, name: string) => {
    const all: any[] = []; let off = 0;
    while (true) {
      const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: { startDate: start, endDate: end, dimensions: ["page"], rowLimit: 25000, startRow: off } });
      const rows = r.data.rows || []; if (!rows.length) break; all.push(...rows); off += rows.length;
      process.stderr.write(`  ${name}: ${all.length}\n`); if (rows.length < 25000) break;
    }
    fs.writeFileSync(`/private/tmp/ref9_${name}.json`, JSON.stringify(all));
    return all;
  };
  const R = await dump("2026-08-06", "2026-09-02", "r28");
  const P = await dump("2026-07-09", "2026-08-05", "p28");
  const buckets = [[1,3],[3,5],[5,10],[10,20],[20,50],[50,1000]];
  const show = (name: string, rows: any[]) => {
    const tot = { i: rows.reduce((s,r)=>s+r.impressions,0), c: rows.reduce((s,r)=>s+r.clicks,0) };
    console.log(`\n--- ${name} : ${rows.length} pages avec impressions | ${tot.i} imp | ${tot.c} clics ---`);
    for (const [a,b] of buckets) {
      const s = rows.filter(r=>r.position>=a && r.position<b);
      const i = s.reduce((x,r)=>x+r.impressions,0), c = s.reduce((x,r)=>x+r.clicks,0);
      console.log(`  pos ${String(a).padStart(2)}-${String(b).padStart(4)} : ${String(s.length).padStart(6)} pages | ${String(i).padStart(7)} imp (${(100*i/tot.i).toFixed(1).padStart(5)}%) | ${String(c).padStart(6)} clics (${(100*c/tot.c).toFixed(1).padStart(5)}%)`);
    }
    return { rows, tot };
  };
  const a = show("28j RECENTS 06/08->02/09", R);
  const b = show("28j PRECEDENTS 09/07->05/08", P);
  console.log("\n=== DELTA IMPRESSIONS PAR TRANCHE DE POSITION (recents - precedents) ===");
  let cum = 0;
  for (const [x,y] of buckets) {
    const ir = R.filter(r=>r.position>=x&&r.position<y).reduce((s,r)=>s+r.impressions,0);
    const ip = P.filter(r=>r.position>=x&&r.position<y).reduce((s,r)=>s+r.impressions,0);
    const cr = R.filter(r=>r.position>=x&&r.position<y).reduce((s,r)=>s+r.clicks,0);
    const cp = P.filter(r=>r.position>=x&&r.position<y).reduce((s,r)=>s+r.clicks,0);
    cum += ir-ip;
    console.log(`  pos ${String(x).padStart(2)}-${String(y).padStart(4)} : imp ${String(ir-ip).padStart(8)} | clics ${String(cr-cp).padStart(6)}`);
  }
  console.log(`  TOTAL imp : ${cum}`);
})();
