import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: { startDate: "2026-05-15", endDate: "2026-09-04", dimensions: ["date"], rowLimit: 500 } });
  const rows = (r.data.rows || []).map(x => ({ d: x.keys![0], c: x.clicks!, i: x.impressions!, p: x.position! }));
  console.log("JOURS:", rows.length, "du", rows[0]?.d, "au", rows[rows.length-1]?.d);
  // semaines ISO (lundi)
  const w: Record<string, {c:number;i:number;pw:number;n:number}> = {};
  for (const x of rows) { const d = new Date(x.d + "T00:00:00Z"); const k = new Date(d.getTime() - ((d.getUTCDay()+6)%7)*864e5).toISOString().slice(0,10);
    w[k] ??= {c:0,i:0,pw:0,n:0}; w[k].c+=x.c; w[k].i+=x.i; w[k].pw+=x.p*x.i; w[k].n++; }
  console.log("\n=== PAR SEMAINE ===");
  for (const [k,v] of Object.entries(w).sort()) console.log(`  ${k} (${v.n}j) : ${String(v.c).padStart(5)} clics | ${String(v.i).padStart(7)} imp | CTR ${(100*v.c/v.i).toFixed(2)}% | pos ${(v.pw/v.i).toFixed(1)} | ${(v.c/v.n).toFixed(0)} clics/j`);
  // 28j recents vs precedents, en s appuyant sur le dernier jour AVEC donnees
  const last = rows[rows.length-1].d;
  const idx = rows.length;
  const r28 = rows.slice(idx-28, idx), p28 = rows.slice(idx-56, idx-28);
  const agg = (a: typeof rows) => ({ c: a.reduce((s,x)=>s+x.c,0), i: a.reduce((s,x)=>s+x.i,0), p: a.reduce((s,x)=>s+x.p*x.i,0)/a.reduce((s,x)=>s+x.i,0) });
  const A = agg(r28), B = agg(p28);
  console.log(`\n=== 28j RECENTS (${r28[0].d} -> ${r28[27].d}) vs PRECEDENTS (${p28[0].d} -> ${p28[27].d}) ===`);
  console.log(`  clics       ${A.c} vs ${B.c}  (${(100*(A.c-B.c)/B.c).toFixed(1)}%)  | ${(A.c/28).toFixed(0)} vs ${(B.c/28).toFixed(0)} clics/j`);
  console.log(`  impressions ${A.i} vs ${B.i}  (${(100*(A.i-B.i)/B.i).toFixed(1)}%)`);
  console.log(`  position    ${A.p.toFixed(2)} vs ${B.p.toFixed(2)}`);
  console.log(`  CTR         ${(100*A.c/A.i).toFixed(2)}% vs ${(100*B.c/B.i).toFixed(2)}%`);
  console.log(`\n  dernier jour avec donnees : ${last}`);
  console.log(`  7 derniers jours : ${rows.slice(-7).map(x=>`${x.d}=${x.c}`).join(" ")}`);
})();
