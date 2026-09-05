import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";

const SITE = "https://workwave.fr/";
const OUT = process.env.OUT_DIR || "/private/tmp/gsc";
fs.mkdirSync(OUT, { recursive: true });

// Fenetres. GSC a ~2-3 jours de latence : dernier jour complet = 2026-09-01.
const W = {
  m3:      { s: "2026-06-05", e: "2026-09-01" },
  r28:     { s: "2026-08-05", e: "2026-09-01" },
  p28:     { s: "2026-07-08", e: "2026-08-04" },
};

async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });

  const pull = async (name: string, win: {s:string;e:string}, dims: string[], rowLimit = 25000) => {
    const all: any[] = [];
    let startRow = 0;
    while (true) {
      const r = await sc.searchanalytics.query({
        siteUrl: SITE,
        requestBody: { startDate: win.s, endDate: win.e, dimensions: dims, rowLimit: Math.min(rowLimit, 25000), startRow, type: "web" },
      });
      const rows = r.data.rows || [];
      all.push(...rows);
      if (rows.length < 25000 || all.length >= rowLimit) break;
      startRow += rows.length;
    }
    const f = `${OUT}/${name}.json`;
    fs.writeFileSync(f, JSON.stringify(all));
    console.log(`${name.padEnd(22)} ${String(all.length).padStart(6)} lignes -> ${f}  [${win.s}..${win.e}]`);
    return all;
  };

  // Totaux par jour (sanity check)
  await pull("jours_m3", W.m3, ["date"]);

  // 1+2 : requetes et pages, 3 fenetres
  await pull("q_m3",  W.m3,  ["query"]);
  await pull("q_r28", W.r28, ["query"]);
  await pull("q_p28", W.p28, ["query"]);
  await pull("p_m3",  W.m3,  ["page"]);
  await pull("p_r28", W.r28, ["page"]);
  await pull("p_p28", W.p28, ["page"]);

  // Couple requete x page sur 28j recents : indispensable pour rattacher
  // une opportunite a la page exacte a corriger.
  await pull("qp_r28", W.r28, ["query", "page"]);
}
main().catch(e => { console.error("ERREUR", e?.response?.data?.error?.message || e.message); process.exit(1); });
