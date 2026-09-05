import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
const SITE = "https://workwave.fr/";
function jour(d: Date) { return d.toISOString().slice(0, 10); }
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const fin = new Date(Date.now() - 3 * 86400000), deb = new Date(Date.now() - 30 * 86400000);
  console.log(`fenetre ${jour(deb)} -> ${jour(fin)}`);
  // total site
  const tot = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: jour(deb), endDate: jour(fin), dimensions: [] } });
  console.log("TOTAL SITE :", JSON.stringify(tot.data.rows?.[0] || {}));
  // pages /artisan/
  const rows: any[] = [];
  for (let start = 0; start < 120000; start += 5000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: {
      startDate: jour(deb), endDate: jour(fin), dimensions: ["page"], rowLimit: 5000, startRow: start,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }],
    }});
    const b = r.data.rows || []; rows.push(...b);
    if (b.length < 5000) break;
  }
  const clics = rows.reduce((s, r) => s + (r.clicks || 0), 0);
  const impr = rows.reduce((s, r) => s + (r.impressions || 0), 0);
  console.log(`fiches /artisan/ avec au moins 1 impression : ${rows.length}`);
  console.log(`  clics=${clics}  impressions=${impr}`);
  console.log(`  fiches avec >=1 clic : ${rows.filter(r => (r.clicks || 0) > 0).length}`);
  // classement par etat
  const sb = getServiceClient();
  const slugs = rows.map(r => (r.keys?.[0] || "").split("/artisan/")[1]).filter(Boolean).map(s => s.replace(/\/$/, ""));
  const etatDe = new Map<string, string>();
  for (let i = 0; i < slugs.length; i += 200) {
    const { data } = await sb.from("pros").select("slug, etat_admin").in("slug", slugs.slice(i, i + 200));
    for (const p of (data || []) as any[]) etatDe.set(p.slug, p.etat_admin);
  }
  const agg: Record<string, { n: number; c: number; i: number }> = {};
  for (const r of rows) {
    const s = (r.keys?.[0] || "").split("/artisan/")[1]?.replace(/\/$/, "");
    const e = etatDe.get(s) || "inconnu";
    agg[e] = agg[e] || { n: 0, c: 0, i: 0 };
    agg[e].n++; agg[e].c += r.clicks || 0; agg[e].i += r.impressions || 0;
  }
  for (const [e, v] of Object.entries(agg)) console.log(`  etat=${e} : ${v.n} fiches, ${v.c} clics, ${v.i} impressions`);
}
main();
