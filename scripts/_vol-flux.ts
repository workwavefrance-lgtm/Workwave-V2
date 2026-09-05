import { google } from "googleapis";
async function pages(sc: any, site: string, a: string, b: string) {
  const s = new Set<string>(); const rows: any[] = [];
  for (let o = 0; o < 400000; o += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: site, requestBody: { startDate: a, endDate: b, dimensions: ["page"], rowLimit: 25000, startRow: o, type: "web" } });
    const d = r.data.rows || []; rows.push(...d); d.forEach((x: any) => s.add(x.keys[0]));
    if (d.length < 25000) break;
  }
  return { s, rows };
}
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: await auth.getClient() as any });
  const site = "https://workwave.fr/";
  const A = await pages(sc, site, "2026-07-08", "2026-08-04");
  const B = await pages(sc, site, "2026-08-05", "2026-09-01");
  let nouvelles = 0, perdues = 0;
  for (const u of B.s) if (!A.s.has(u)) nouvelles++;
  for (const u of A.s) if (!B.s.has(u)) perdues++;
  console.log(`fenetre A (08/07-04/08) : ${A.s.size} pages visibles`);
  console.log(`fenetre B (05/08-01/09) : ${B.s.size} pages visibles`);
  console.log(`NOUVELLES en B : ${nouvelles} (${(nouvelles/28).toFixed(0)}/jour) | PERDUES : ${perdues} | net ${B.s.size - A.s.size}`);
  // combien des nouvelles ont deja un clic
  const nb = B.rows.filter((r: any) => !A.s.has(r.keys[0]));
  const avecClic = nb.filter((r: any) => r.clicks > 0).length;
  const clics = nb.reduce((t: number, r: any) => t + r.clicks, 0);
  console.log(`Les nouvelles pages : ${avecClic} avec >=1 clic (${(100*avecClic/nb.length).toFixed(1)}%), ${clics} clics soit ${(clics/nb.length/28).toFixed(5)} clic/j/page`);
}
main();
