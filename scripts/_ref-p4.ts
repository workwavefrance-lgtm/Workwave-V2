import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const fen = [["avant","2026-07-01","2026-07-31"],["apres","2026-08-20","2026-09-02"]];
  for (const [nom,s,e] of fen) {
    const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
      startDate: s, endDate: e, dimensions: ["page"], rowLimit: 25000,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/plombier/" }] }] } });
    const rows = r.data.rows || [];
    const bucket = (u:string) => {
      if (/marseille|bouches-du-rhone|aix-en-provence|arles|aubagne|martigues|istres|salon/.test(u)) return "13 (rescrape aout)";
      if (/\/paris|lyon|villeurbanne|rhone-69|nord-59|lille|gironde-33|bordeaux|haute-garonne-31|toulouse|alpes-maritimes-06|nice|loire-atlantique-44|nantes/.test(u)) return "denses NON rescrapes";
      return "reste";
    };
    const agg: Record<string,{c:number;i:number;n:number}> = {};
    for (const row of rows) {
      const b = bucket(row.keys![0]);
      agg[b] = agg[b] || {c:0,i:0,n:0};
      agg[b].c += row.clicks||0; agg[b].i += row.impressions||0; agg[b].n++;
    }
    console.log(`\n[${nom}] ${s} -> ${e}  (${rows.length} pages /plombier/ avec impressions)`);
    for (const [k,v] of Object.entries(agg)) console.log(`   ${k.padEnd(24)} pages=${String(v.n).padStart(5)} clics=${String(v.c).padStart(5)} impressions=${String(v.i).padStart(7)}`);
  }
})();
