/**
 * Les fiches d'etablissements FERMES, refaites le 02/09 pour annoncer des
 * faits du registre, cliquent-elles mieux que les fiches OUVERTES qui
 * servaient une phrase vide ? Comparaison a position comparable, sinon on
 * compare le classement, pas le texte.
 */
import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
const SITE = "https://workwave.fr/";
const sb = getServiceClient();
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const rows: any[] = [];
  for (let startRow = 0; ; startRow += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 25000, startRow } });
    const d = r.data.rows || []; rows.push(...d); if (d.length < 25000) break;
  }
  const fiches = rows.filter((x) => x.keys[0].includes("/artisan/"));
  const slugs = fiches.map((x) => x.keys[0].split("/artisan/")[1].replace(/\/$/, ""));
  console.log(`${fiches.length} fiches avec impressions, lecture de leur etat en base...`);

  const etat = new Map<string, string>();
  const PAGE = 300;
  for (let i = 0; i < slugs.length; i += PAGE) {
    const { data, error } = await sb.from("pros").select("slug, etat_admin").in("slug", slugs.slice(i, i + PAGE));
    if (error) { console.log("erreur :", error.message); break; }
    for (const p of data || []) etat.set(p.slug, p.etat_admin || "?");
  }
  console.log(`${etat.size} retrouvees en base\n`);

  const bornes = [[1, 3], [3, 6], [6, 11], [11, 21]];
  console.log("  position   fiches OUVERTES              fiches FERMEES             ecart de CTR");
  for (const [a, b] of bornes) {
    const g = fiches.filter((x) => (x.position || 999) >= a && (x.position || 999) < b);
    const part = (f: (e: string) => boolean) => {
      const s = g.filter((x) => f(etat.get(x.keys[0].split("/artisan/")[1].replace(/\/$/, "")) || "?"));
      const i = s.reduce((t, x) => t + x.impressions, 0), c = s.reduce((t, x) => t + x.clicks, 0);
      return { n: s.length, i, c, ctr: i ? c / i * 100 : 0 };
    };
    const o = part((e) => e === "A"), f = part((e) => e === "F");
    const ecart = o.ctr ? (f.ctr / o.ctr - 1) * 100 : 0;
    console.log(`  ${String(a).padStart(2)}-${String(b - 1).padEnd(3)} ${String(o.n).padStart(8)} p · ${String(o.i).padStart(6)} imp · CTR ${o.ctr.toFixed(2).padStart(5)} %   ${String(f.n).padStart(6)} p · ${String(f.i).padStart(6)} imp · CTR ${f.ctr.toFixed(2).padStart(5)} %   ${ecart >= 0 ? "+" : ""}${ecart.toFixed(0)} %`);
  }
})();
