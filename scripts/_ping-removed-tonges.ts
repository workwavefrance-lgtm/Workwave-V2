/**
 * Ping Google Indexing API en URL_DELETED pour la fiche RGPD-supprimée
 * yvonne-tonges-00013 (déjà 404 en prod). Auth ADC, scope indexing.
 */
import { google } from "googleapis";

async function main() {
  const auth = new google.auth.GoogleAuth({
    scopes: [
      "https://www.googleapis.com/auth/indexing",
      "https://www.googleapis.com/auth/cloud-platform",
    ],
  });
  const indexing = google.indexing({ version: "v3", auth });
  const url = "https://workwave.fr/artisan/yvonne-tonges-00013";
  const res = await indexing.urlNotifications.publish({
    requestBody: { url, type: "URL_DELETED" },
  });
  console.log(`✓ URL_DELETED pingé : ${url}`);
  console.log(JSON.stringify(res.data, null, 2));
}
main().catch((e) => { console.error("Erreur :", e.message); process.exit(1); });
