import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({
    siteUrl: "https://workwave.fr/",
    requestBody: { startDate: "2026-08-05", endDate: "2026-09-03", dimensions: ["page"], rowLimit: 25000 },
  });
  const rows = r.data.rows || [];
  const cat = { dept: [0,0,0], commune: [0,0,0], fiche: [0,0,0], autre: [0,0,0] } as Record<string, number[]>;
  const communes: {u:string,c:number,i:number}[] = [];
  for (const row of rows) {
    const u = (row.keys![0] || "").replace("https://workwave.fr", "");
    const cl = row.clicks || 0, im = row.impressions || 0;
    let k = "autre";
    if (/^\/artisan\//.test(u)) k = "fiche";
    else if (/^\/[a-z0-9-]+\/[a-z0-9-]+$/.test(u)) {
      if (/-([0-9]{2,3}|wbr|bru|wht|wlg|wlx|wna)$/.test(u)) k = "dept";
      else { k = "commune"; communes.push({u, c: cl, i: im}); }
    }
    cat[k][0] += cl; cat[k][1] += im; cat[k][2]++;
  }
  console.log("FENETRE 30 JOURS (2026-08-05 -> 2026-09-03), lignes GSC:", rows.length);
  for (const k of Object.keys(cat)) {
    const [c,i,n] = cat[k];
    console.log(`  ${k.padEnd(8)} : ${n} URL, ${c} clics, ${i} impressions, CTR ${i?((c/i)*100).toFixed(2):"0"}%, clics/jour ${(c/30).toFixed(2)}`);
  }
  communes.sort((a,b)=>b.c-a.c);
  console.log("\nTOP 15 pages metier x commune :");
  for (const x of communes.slice(0,15)) console.log(`  ${x.c} clics / ${x.i} imp  ${x.u}`);
  const zero = communes.filter(x=>x.c===0).length;
  console.log(`\ncommunes avec 0 clic sur 30j : ${zero} / ${communes.length}`);
  const med = communes.map(x=>x.i).sort((a,b)=>a-b)[Math.floor(communes.length/2)];
  console.log(`impressions medianes d une page metier x commune : ${med}`);
})();
