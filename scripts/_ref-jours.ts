import { google } from "googleapis";
import fs from "fs";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
    startDate: "2026-05-01", endDate: "2026-09-04", dimensions: ["date"], rowLimit: 25000 } });
  const rows = r.data.rows || [];
  fs.writeFileSync("/private/tmp/refut/jours.json", JSON.stringify(rows));
  console.log("jours recuperes:", rows.length, "| premier", rows[0]?.keys?.[0], "| dernier", rows[rows.length-1]?.keys?.[0]);
})();
