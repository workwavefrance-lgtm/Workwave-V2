import { google } from "googleapis";
async function pages(sc: any, site: string, a: string, b: string) {
  const m = new Map<string, { c: number; i: number }>();
  for (let o = 0; o < 400000; o += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: site, requestBody: { startDate: a, endDate: b, dimensions: ["page"], rowLimit: 25000, startRow: o, type: "web" } });
    const d = r.data.rows || []; d.forEach((x: any) => m.set(x.keys[0], { c: x.clicks, i: x.impressions }));
    if (d.length < 25000) break;
  }
  return m;
}
const fam = (u: string) => {
  const p = new URL(u).pathname;
  if (p.startsWith("/artisan/")) return "fiche";
  const seg = p.split("/").filter(Boolean);
  if (seg.length === 2 && !p.startsWith("/ai") && !p.startsWith("/trouver") && !p.startsWith("/guide") && !p.startsWith("/blog"))
    return /-(\d{2,3}|2a|2b|bru|wbr|wht|wlg|wlx|wna)$/i.test(seg[1]) ? "listing-dept" : "listing-ville";
  return "autre";
};
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: await auth.getClient() as any });
  const site = "https://workwave.fr/";
  const A = await pages(sc, site, "2026-07-08", "2026-08-04");
  const B = await pages(sc, site, "2026-08-05", "2026-09-01");
  const noyau: string[] = [], frange: string[] = [];
  for (const u of B.keys()) (A.has(u) ? noyau : frange).push(u);
  const stat = (l: string[], m: Map<string, any>) => {
    const c = l.reduce((t, u) => t + m.get(u)!.c, 0);
    const i = l.reduce((t, u) => t + m.get(u)!.i, 0);
    const pc = l.filter((u) => m.get(u)!.c > 0).length;
    return `${l.length} pages | ${pc} a clic (${(100*pc/l.length).toFixed(1)}%) | ${c} clics | ${(c/l.length/28).toFixed(5)} clic/j/page | ${(i/l.length).toFixed(2)} imp/page`;
  };
  console.log("NOYAU (visible aux 2 fenetres) : " + stat(noyau, B));
  console.log("FRANGE (nouvelle en B)        : " + stat(frange, B));
  for (const f of ["fiche", "listing-ville", "listing-dept"]) {
    const n = noyau.filter((u) => fam(u) === f), g = frange.filter((u) => fam(u) === f);
    console.log(`  ${f} noyau  : ${stat(n, B)}`);
    console.log(`  ${f} frange : ${stat(g, B)}`);
  }
}
main();
