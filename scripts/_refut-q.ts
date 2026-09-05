import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
    startDate: "2026-08-06", endDate: "2026-09-02", dimensions: ["query"], rowLimit: 25000,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }] } });
  const rows = r.data.rows || [];
  const tot = rows.reduce((a,b)=>({c:a.c+b.clicks!,i:a.i+b.impressions!}),{c:0,i:0});
  console.log(`requetes distinctes sur /artisan/ : ${rows.length} · ${tot.c} clics · ${tot.i} impressions\n`);
  console.log("TOP 20 requetes :");
  for (const q of rows.slice(0,20)) console.log(`  ${String(q.clicks).padStart(5)} clics ${String(q.impressions).padStart(7)} impr  ${q.keys![0]}`);
  // intention "marche / donnees" vs "trouver une entreprise"
  const marche = /prix|tarif|cout|coût|marche|marché|logement|immobilier|construction|permis|statistique|revenu|densite|densité|population|combien de logement/i;
  let mC=0,mI=0,n=0;
  for (const q of rows) if (marche.test(q.keys![0])) { mC+=q.clicks!; mI+=q.impressions!; n++; }
  console.log(`\nrequetes a intention "marche/donnees locales" : ${n} requetes, ${mC} clics (${(mC/(tot.c||1)*100).toFixed(2)} %), ${mI} impressions (${(mI/(tot.i||1)*100).toFixed(2)} %)`);
})();
