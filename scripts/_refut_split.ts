import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";

(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({
    siteUrl: "https://workwave.fr/",
    requestBody: { startDate: "2026-08-06", endDate: "2026-09-02", dimensions: ["page"], rowLimit: 25000,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }] },
  });
  const rows = (r.data.rows || []).map((x) => ({
    slug: decodeURIComponent(x.keys![0].split("/artisan/")[1] || "").replace(/\/$/, ""),
    c: x.clicks || 0, i: x.impressions || 0,
  })).filter((x) => x.slug);
  console.log("pages fiches remontees par GSC :", rows.length);
  const sb = getServiceClient();
  const map = new Map<string, string>();
  const slugs = rows.map((x) => x.slug);
  for (let k = 0; k < slugs.length; k += 200) {
    const { data } = await sb.from("pros").select("slug, etat_admin").in("slug", slugs.slice(k, k + 200));
    for (const d of data || []) map.set(d.slug, d.etat_admin);
  }
  const acc = { F: { c: 0, i: 0, n: 0 }, A: { c: 0, i: 0, n: 0 }, X: { c: 0, i: 0, n: 0 } };
  for (const x of rows) {
    const e = map.get(x.slug); const k = e === "F" ? "F" : e === "A" ? "A" : "X";
    acc[k].c += x.c; acc[k].i += x.i; acc[k].n++;
  }
  for (const [k, v] of Object.entries(acc))
    console.log(`${k === "F" ? "FERMES " : k === "A" ? "OUVERTS" : "inconnu"} : ${v.n} pages, ${v.c} clics, ${v.i} impressions`);
  const tot = acc.F.c + acc.A.c;
  console.log("part des clics fiches venant de fermes :", ((acc.F.c / tot) * 100).toFixed(1) + " %");
  console.log("clics/jour perdus si fermes valaient 0 :", (acc.F.c / 28).toFixed(1));
})();
