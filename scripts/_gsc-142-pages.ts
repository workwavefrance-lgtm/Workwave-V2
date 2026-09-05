/**
 * Les pages en premiere page de Google (position < 11), au moins 20 impressions,
 * et ZERO clic sur 28 jours. Avec leur code HTTP reel.
 */
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const rows: any[] = [];
  for (let startRow = 0; ; startRow += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 25000, startRow } });
    const d = r.data.rows || []; rows.push(...d); if (d.length < 25000) break;
  }
  const cibles = rows.filter((x) => (x.impressions || 0) >= 20 && (x.clicks || 0) === 0 && (x.position || 99) < 11)
    .sort((a, b) => b.impressions - a.impressions);
  console.log(`${cibles.length} pages · ${cibles.reduce((s, x) => s + x.impressions, 0)} impressions perdues`);
  const out: any[] = [];
  let i = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (i < cibles.length) {
      const c = cibles[i++];
      const u = c.keys[0];
      try {
        const r = await fetch(u, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(20000) });
        out.push({ url: u.replace(SITE, "/"), imp: c.impressions, pos: Math.round((c.position || 0) * 10) / 10, code: r.status, vers: r.headers.get("location") || "" });
      } catch { out.push({ url: u.replace(SITE, "/"), imp: c.impressions, pos: Math.round((c.position || 0) * 10) / 10, code: 0, vers: "" }); }
    }
  }));
  out.sort((a, b) => b.imp - a.imp);
  const parCode: Record<string, number> = {}; const impParCode: Record<string, number> = {};
  for (const o of out) { parCode[o.code] = (parCode[o.code] || 0) + 1; impParCode[o.code] = (impParCode[o.code] || 0) + o.imp; }
  console.log("par code HTTP :", parCode); console.log("impressions par code :", impParCode);
  require("fs").writeFileSync("/tmp/pages-142.json", JSON.stringify(out, null, 1));
  console.log("\nles 15 premieres :");
  for (const o of out.slice(0, 15)) console.log(`  ${o.code} · ${o.imp} imp · pos ${o.pos} · ${o.url}${o.vers ? " -> " + o.vers.replace("https://workwave.fr", "") : ""}`);
})();
