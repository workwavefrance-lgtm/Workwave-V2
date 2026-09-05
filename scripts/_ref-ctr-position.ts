import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-08-05", E = "2026-09-01";

async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const q = async (body: any) => {
    const all: any[] = []; let start = 0;
    while (true) {
      const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { ...body, startRow: start, rowLimit: 25000 } });
      const rows = r.data.rows || []; if (!rows.length) break;
      all.push(...rows); start += rows.length; if (rows.length < 25000) break;
    }
    return all;
  };
  const sum = (a: any[]) => ({ i: a.reduce((x, r) => x + r.impressions, 0), c: a.reduce((x, r) => x + r.clicks, 0), n: a.length });

  // A) TOTAL SITE sans dimension
  const tot = await q({ startDate: S, endDate: E, dimensions: [] });
  const T = sum(tot);
  console.log(`TOTAL SITE ${S}->${E} : ${T.i} impressions | ${T.c} clics | CTR ${(100*T.c/T.i).toFixed(2)}%`);

  // B) dimension QUERY seule
  const qq = await q({ startDate: S, endDate: E, dimensions: ["query"] });
  const Q = sum(qq);
  console.log(`Dim QUERY   : ${Q.n} requetes | ${Q.i} imp (${(100*Q.i/T.i).toFixed(1)}% du total) | ${Q.c} clics (${(100*Q.c/T.c).toFixed(1)}% du total) | CTR ${(100*Q.c/Q.i).toFixed(2)}%`);
  console.log(`   >>> POOL ANONYMISE : ${T.i-Q.i} imp | ${T.c-Q.c} clics | CTR ${(100*(T.c-Q.c)/(T.i-Q.i)).toFixed(2)}%`);

  // C) dimension QUERY x PAGE
  const qp = await q({ startDate: S, endDate: E, dimensions: ["query", "page"] });
  const QP = sum(qp);
  console.log(`Dim QUERY+PAGE : ${QP.n} couples | ${QP.i} imp (${(100*QP.i/T.i).toFixed(1)}%) | ${QP.c} clics (${(100*QP.c/T.c).toFixed(1)}%) | CTR ${(100*QP.c/QP.i).toFixed(2)}%`);

  // D) dimension PAGE seule (couverture clics quasi totale)
  const pp = await q({ startDate: S, endDate: E, dimensions: ["page"] });
  const P = sum(pp);
  console.log(`Dim PAGE    : ${P.n} pages | ${P.i} imp (${(100*P.i/T.i).toFixed(1)}%) | ${P.c} clics (${(100*P.c/T.c).toFixed(1)}%) | CTR ${(100*P.c/P.i).toFixed(2)}%`);

  require("fs").writeFileSync("/tmp/ref_qp.json", JSON.stringify(qp));
  require("fs").writeFileSync("/tmp/ref_p.json", JSON.stringify(pp));
  require("fs").writeFileSync("/tmp/ref_q.json", JSON.stringify(qq));
}
main().catch(e => { console.error("ERR", e.message); process.exit(1); });
