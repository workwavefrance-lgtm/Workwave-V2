import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const q = async (s: string, e: string) => { const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: { startDate: s, endDate: e, dimensions: [] } });
    const x = r.data.rows?.[0]; return { c: x?.clicks ?? 0, i: x?.impressions ?? 0, p: x?.position ?? 0 }; };
  console.log("=== EFFET DE LA LATENCE GSC : meme comparaison, fenetres decalees ===");
  for (const [nom, ra, rb, pa, pb] of [
    ["fin 02/09 (2 jours les plus frais inclus)", "2026-08-06","2026-09-02","2026-07-09","2026-08-05"],
    ["fin 31/08 (2 jours les plus frais exclus)", "2026-08-04","2026-08-31","2026-07-07","2026-08-03"],
  ] as const) {
    const A = await q(ra, rb), B = await q(pa, pb);
    console.log(`\n  ${nom}`);
    console.log(`    recents ${ra}->${rb} : ${A.c} clics (${(A.c/28).toFixed(0)}/j) | ${A.i} imp | pos ${A.p.toFixed(2)}`);
    console.log(`    precedents ${pa}->${pb} : ${B.c} clics (${(B.c/28).toFixed(0)}/j) | ${B.i} imp | pos ${B.p.toFixed(2)}`);
    console.log(`    ecart clics ${(100*(A.c-B.c)/B.c).toFixed(1)}% | ecart imp ${(100*(A.i-B.i)/B.i).toFixed(1)}%`);
  }
})();
