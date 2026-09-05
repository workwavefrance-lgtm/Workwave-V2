/**
 * Les 12 derniers jours disponibles dans GSC, jour par jour.
 * Objectif : departager "vue 24 h partielle" d'un vrai effondrement.
 */
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const fin = new Date().toISOString().slice(0, 10);
  const debut = new Date(Date.now() - 16 * 86400e3).toISOString().slice(0, 10);
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
    startDate: debut, endDate: fin, dimensions: ["date"], rowLimit: 30,
  }});
  const rows = (r.data.rows || []) as { keys: string[]; clicks: number; impressions: number; position: number; ctr: number }[];
  console.log("date         clics   impressions   CTR     position");
  for (const x of rows)
    console.log(`${x.keys[0]}   ${String(x.clicks).padStart(5)}   ${String(x.impressions).padStart(11)}   ${(x.ctr*100).toFixed(1).padStart(4)}%   ${x.position.toFixed(1).padStart(5)}`);
  const n = rows.length;
  if (n >= 6) {
    const recent = rows.slice(-3), avant = rows.slice(-6, -3);
    const moy = (a: typeof rows) => (a.reduce((s, x) => s + x.clicks, 0) / a.length).toFixed(0);
    console.log(`\n  moyenne des 3 derniers jours disponibles : ${moy(recent)} clics/jour`);
    console.log(`  les 3 jours precedents                  : ${moy(avant)} clics/jour`);
  }
})();
