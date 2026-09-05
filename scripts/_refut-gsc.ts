import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const site = "https://workwave.fr/";
  const start = "2026-08-06", end = "2026-09-02"; // 28 jours
  let rows: any[] = [], off = 0;
  while (true) {
    const r = await sc.searchanalytics.query({ siteUrl: site, requestBody: {
      startDate: start, endDate: end, dimensions: ["page"], rowLimit: 25000, startRow: off } });
    const d = r.data.rows || []; if (!d.length) break; rows.push(...d); off += d.length;
    if (d.length < 25000) break;
  }
  console.log(`pages avec au moins une impression sur ${start} -> ${end} : ${rows.length}\n`);
  const fam = (u: string) => {
    const p = new URL(u).pathname;
    if (p.startsWith("/artisan/")) return "/artisan/[slug]";
    if (p.startsWith("/guide-des-prix/")) return "/guide-des-prix/";
    if (p.startsWith("/trouver-des-chantiers/")) return "/trouver-des-chantiers/";
    if (p.startsWith("/trouver-des-clients/")) return "/trouver-des-clients/";
    if (p.startsWith("/blog/")) return "/blog/";
    if (p.startsWith("/ai/") || p.startsWith("/en/")) return "/ai + /en";
    if (p.startsWith("/barometre")) return "/barometre-*";
    if (p === "/") return "accueil";
    const seg = p.split("/").filter(Boolean);
    if (seg.length === 1) return "/[metier]";
    if (seg.length === 2) return /\-\d{2,3}$/.test(seg[1]) ? "/[metier]/[dept]" : "/[metier]/[ville]";
    if (seg.length === 3) return "/[metier]/[specialite]/[ville]";
    return "autre";
  };
  const agg: Record<string, {c:number;i:number;n:number}> = {};
  for (const r of rows) {
    const f = fam(r.keys[0]);
    agg[f] = agg[f] || {c:0,i:0,n:0};
    agg[f].c += r.clicks; agg[f].i += r.impressions; agg[f].n++;
  }
  const tot = Object.values(agg).reduce((a,b)=>({c:a.c+b.c,i:a.i+b.i,n:a.n+b.n}),{c:0,i:0,n:0});
  console.log("famille".padEnd(30), "pages".padStart(7), "clics".padStart(8), "impr.".padStart(10), "clics/j".padStart(9), "CTR");
  for (const [k,v] of Object.entries(agg).sort((a,b)=>b[1].c-a[1].c))
    console.log(k.padEnd(30), String(v.n).padStart(7), String(v.c).padStart(8), String(v.i).padStart(10),
      (v.c/28).toFixed(1).padStart(9), ((v.c/(v.i||1))*100).toFixed(2)+" %");
  console.log("TOTAL".padEnd(30), String(tot.n).padStart(7), String(tot.c).padStart(8), String(tot.i).padStart(10), (tot.c/28).toFixed(1).padStart(9));
})();
