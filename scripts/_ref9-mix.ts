import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const dump = async (s: string, e: string) => { const all: any[] = []; let off = 0;
    while (true) { const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: { startDate: s, endDate: e, dimensions: ["page"], rowLimit: 25000, startRow: off } });
      const rows = r.data.rows || []; if (!rows.length) break; all.push(...rows); off += rows.length; if (rows.length < 25000) break; } return all; };
  const typ = (u: string) => { const p = u.replace("https://workwave.fr","").split("?")[0];
    if (p === "/") return "accueil"; if (p.startsWith("/artisan/")) return "fiche"; if (p.startsWith("/guide-des-prix/")) return "guide-prix";
    if (p.startsWith("/barometre")) return "barometre"; if (p.startsWith("/trouver-des-")) return "acquisition-pro";
    if (p.startsWith("/pro")) return "pro"; if (p.startsWith("/ai/")) return "ai"; if (p.startsWith("/blog")) return "blog";
    const s = p.split("/").filter(Boolean); if (s.length === 1) return "racine-metier";
    if (s.length === 2) return /-\d{2,3}$/.test(s[1]) ? "metier-dept" : "metier-ville"; if (s.length === 3) return "metier-spe-ville"; return "autre"; };
  for (const [nom, s, e] of [["PIC 20/07","2026-07-20","2026-07-26"],["RECENT 24/08","2026-08-24","2026-08-30"]] as const) {
    const rows = (await dump(s, e)).filter(r => r.position < 5);
    const t: Record<string, {n:number;i:number;c:number}> = {};
    for (const r of rows) { const k = typ(r.keys![0]); t[k] ??= {n:0,i:0,c:0}; t[k].n++; t[k].i += r.impressions; t[k].c += r.clicks; }
    const tc = rows.reduce((x,r)=>x+r.clicks,0), ti = rows.reduce((x,r)=>x+r.impressions,0);
    console.log(`\n=== ${nom} | pages en POSITION 1-5 : ${rows.length} pages | ${ti} imp | ${tc} clics | CTR ${(100*tc/ti).toFixed(2)}% ===`);
    for (const [k,v] of Object.entries(t).sort((a,b)=>b[1].c-a[1].c).slice(0,7))
      console.log(`  ${k.padEnd(16)} ${String(v.n).padStart(5)} pages | ${String(v.i).padStart(6)} imp | ${String(v.c).padStart(5)} clics | CTR ${(100*v.c/v.i).toFixed(2)}%`);
  }
})();
