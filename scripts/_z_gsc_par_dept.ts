/** Ou sont les impressions AUJOURD'HUI, par departement, sur les listings
 *  metier x lieu. Sert a choisir l'ordre du rattrapage. */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
import fs from "fs";
const SITE = "https://workwave.fr/";
const sb = getServiceClient();
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const rows: any[] = [];
  for (let startRow = 0; ; startRow += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: "2026-08-08", endDate: "2026-09-04", dimensions: ["page"], rowLimit: 25000, startRow } });
    const d = r.data.rows || []; rows.push(...d); if (d.length < 25000) break;
  }
  console.log("pages avec impressions :", rows.length);
  // carte slug ville -> code dept
  const ville2dept = new Map<string, string>();
  let off = 0;
  while (true) {
    const { data } = await sb.from("cities").select("slug, departments!inner(code, country)").eq("country","FR").range(off, off + 999);
    const r = data || []; if (!r.length) break;
    for (const c of r as any[]) if (!ville2dept.has(c.slug)) ville2dept.set(c.slug, c.departments.code);
    off += r.length;
  }
  console.log("communes FR chargees :", ville2dept.size);
  const par: Record<string, { i: number; c: number; p: number }> = {};
  let nonMappe = 0;
  for (const x of rows) {
    const p = (x.keys[0] as string).replace(SITE, "/");
    const seg = p.split("/").filter(Boolean);
    if (seg.length !== 2) continue;
    const lieu = seg[1];
    let dept: string | undefined;
    const m = lieu.match(/-(\d{2,3})$/);
    if (m) dept = m[1];
    else dept = ville2dept.get(lieu);
    if (!dept) { nonMappe++; continue; }
    (par[dept] ||= { i: 0, c: 0, p: 0 });
    par[dept].i += x.impressions; par[dept].c += x.clicks; par[dept].p++;
  }
  console.log("listings non rattaches a un dept :", nonMappe);
  const LANCEUR = "76 67 38 35 95 78 77 94 92 83 06 34 31 44 59 33 69 13 75".split(" ");
  const tot = Object.values(par).reduce((s, v) => s + v.i, 0);
  console.log(`\nimpressions listings metier x lieu (28 j, 08/08-04/09) : ${tot}`);
  console.log("\ndept  pages  impressions  clics   dans le lanceur ?");
  const classe = Object.entries(par).sort((a, b) => b[1].i - a[1].i);
  for (const [d, v] of classe.slice(0, 30))
    console.log(`  ${d.padStart(3)} ${String(v.p).padStart(6)} ${String(v.i).padStart(12)} ${String(v.c).padStart(6)}   ${LANCEUR.includes(d) ? "oui" : (d === "93" ? "NON <- 93" : "non")}`);
  const dansLanceur = LANCEUR.reduce((s, d) => s + (par[d]?.i || 0), 0);
  console.log(`\nimpressions couvertes par les 19 depts du lanceur : ${dansLanceur} sur ${tot} (${(dansLanceur/tot*100).toFixed(1)} %)`);
  console.log(`93 seul : ${par["93"]?.i || 0} impressions`);
  fs.writeFileSync("/tmp/gsc_par_dept.json", JSON.stringify(par, null, 1));
})();
