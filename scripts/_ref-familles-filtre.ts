import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const S = "2026-08-05", E = "2026-09-01";

async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });

  const mesure = async (label: string, regex: string) => {
    let pages = 0, clics = 0, imps = 0;
    for (let start = 0; start < 30000; start += 5000) {
      const r = await sc.searchanalytics.query({
        siteUrl: SITE,
        requestBody: {
          startDate: S, endDate: E, dimensions: ["page"], rowLimit: 5000, startRow: start,
          dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "includingRegex", expression: regex }] }],
        },
      });
      const rows = r.data.rows || [];
      for (const x of rows) { pages++; clics += x.clicks || 0; imps += x.impressions || 0; }
      if (rows.length < 5000) break;
    }
    console.log(`${label} | pages=${pages} | clics28j=${clics} | imp28j=${imps} | clics/jour=${(clics/28).toFixed(2)}`);
  };

  console.log(`fenetre ${S} -> ${E}\n`);
  await mesure("SPECIALITE/ville (3 seg, hors intentions)",
    "^https://workwave\\.fr/[a-z0-9-]+/(?!urgence|installation|obligation|location-saisonniere|guide|prix)[a-z0-9-]+/[a-z0-9-]+$");
  await mesure("INTENTION/ville (urgence|installation|obligation)",
    "^https://workwave\\.fr/[a-z0-9-]+/(urgence|installation|obligation)/[a-z0-9-]+$");
  await mesure("location-saisonniere/ville",
    "^https://workwave\\.fr/[a-z0-9-]+/location-saisonniere/[a-z0-9-]+$");
  await mesure("trouver-des-chantiers/* (tous)", "^https://workwave\\.fr/trouver-des-chantiers/");
  await mesure("trouver-des-chantiers/DEPT (slug -NN)", "^https://workwave\\.fr/trouver-des-chantiers/[a-z0-9-]+-[0-9]{2,3}$");
  await mesure("blog/article", "^https://workwave\\.fr/blog/");
  await mesure("metier/VILLE (2 seg, non dept)", "^https://workwave\\.fr/[a-z0-9-]+/(?![a-z0-9-]*-[0-9]{2,3}$)[a-z0-9-]+$");
}
main().catch(e => { console.error(e.message); process.exit(1); });
