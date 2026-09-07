/** Clics par semaine depuis juin, pour confronter volume indexe et trafic. */
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({
    siteUrl: SITE, requestBody: { startDate: "2026-06-01", endDate: "2026-09-06", dimensions: ["date"], rowLimit: 200 },
  });
  const rows = (r.data.rows || []).sort((a: any, b: any) => a.keys[0].localeCompare(b.keys[0]));
  // Agregation par semaine ISO simplifiee : paquets de 7 jours
  const sem: { debut: string; clics: number; imp: number; pos: number; n: number }[] = [];
  for (let i = 0; i < rows.length; i += 7) {
    const p = rows.slice(i, i + 7) as any[];
    sem.push({
      debut: p[0].keys[0],
      clics: p.reduce((s, x) => s + x.clicks, 0),
      imp: p.reduce((s, x) => s + x.impressions, 0),
      pos: p.reduce((s, x) => s + (x.position || 0), 0) / p.length,
      n: p.length,
    });
  }
  console.log("  semaine du   clics   par jour   impressions   position");
  for (const s of sem) {
    console.log(`  ${s.debut}  ${String(s.clics).padStart(6)}  ${String(Math.round(s.clics / s.n)).padStart(8)}  ${String(s.imp).padStart(12)}   ${(Math.round(s.pos * 10) / 10).toString().padStart(6)}`);
  }
  const max = sem.reduce((a, b) => (b.clics / b.n > a.clics / a.n ? b : a));
  console.log(`\n  meilleure semaine : ${max.debut}, ${Math.round(max.clics / max.n)} clics par jour`);
})();
