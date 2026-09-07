/** Combien de PAGES distinctes recoivent des impressions, avant et apres la chute. */
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const fenetres: [string, string, string][] = [
    ["avant la chute", "2026-07-14", "2026-07-20"],
    ["la chute", "2026-07-28", "2026-08-03"],
    ["apres", "2026-08-25", "2026-08-31"],
  ];
  console.log("  fenetre            pages distinctes   requetes distinctes   impressions   clics");
  for (const [nom, d, f] of fenetres) {
    const pages: any[] = [];
    for (let start = 0; ; start += 25000) {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: d, endDate: f, dimensions: ["page"], rowLimit: 25000, startRow: start } });
      const x = r.data.rows || []; pages.push(...x); if (x.length < 25000) break;
    }
    const q = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: d, endDate: f, dimensions: ["query"], rowLimit: 25000 } });
    const imp = pages.reduce((s, x) => s + x.impressions, 0);
    const cl = pages.reduce((s, x) => s + x.clicks, 0);
    console.log(`  ${nom.padEnd(18)} ${String(pages.length).padStart(16)} ${String((q.data.rows || []).length).padStart(21)} ${String(imp).padStart(13)} ${String(cl).padStart(7)}`);
  }
})();
