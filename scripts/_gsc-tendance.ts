/**
 * Tendance GSC jour par jour : clics, impressions, position moyenne.
 * Objectif : departager "vacances d'aout" (volume en baisse, position stable)
 * de "declassement" (position qui se degrade). Fenetre 90 jours.
 */
import { google } from "googleapis";
const SITE = "https://workwave.fr/";

async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const fin = new Date(Date.now() - 2 * 86400e3).toISOString().slice(0, 10);
  const debut = new Date(Date.now() - 92 * 86400e3).toISOString().slice(0, 10);

  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
    startDate: debut, endDate: fin, dimensions: ["date"], rowLimit: 100,
  }});
  const rows = (r.data.rows || []) as { keys: string[]; clicks: number; impressions: number; position: number }[];

  // agregat par semaine ISO (lundi)
  const semaines = new Map<string, { c: number; i: number; pSum: number; pW: number; jours: number }>();
  for (const row of rows) {
    const d = new Date(row.keys[0]);
    const lundi = new Date(d); lundi.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const k = lundi.toISOString().slice(0, 10);
    const s = semaines.get(k) || { c: 0, i: 0, pSum: 0, pW: 0, jours: 0 };
    s.c += row.clicks; s.i += row.impressions;
    s.pSum += row.position * row.impressions; s.pW += row.impressions; s.jours++;
    semaines.set(k, s);
  }

  console.log("semaine du    clics   impressions   position (ponderee)   clics/jour");
  for (const [k, s] of [...semaines.entries()].sort()) {
    const pos = s.pW ? (s.pSum / s.pW).toFixed(1) : "-";
    console.log(`${k}   ${String(s.c).padStart(5)}   ${String(s.i).padStart(11)}   ${String(pos).padStart(8)}              ${(s.c / s.jours).toFixed(0).padStart(4)}`);
  }

  // les 14 derniers jours en detail
  console.log("\nderniers jours :");
  for (const row of rows.slice(-14))
    console.log(`  ${row.keys[0]}   ${String(row.clicks).padStart(4)} clics   ${String(row.impressions).padStart(6)} imp   pos ${row.position.toFixed(1)}`);
}
main();
