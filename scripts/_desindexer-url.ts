/**
 * Demande a Google de RETIRER une URL de son index (type URL_DELETED).
 *
 * A utiliser apres une suppression RGPD : la page renvoie 404 chez nous, mais
 * Google peut la garder affichee plusieurs jours. Ce ping accelere le retrait.
 *
 * PRE-REQUIS (lecon du 29/04/2026) : l'identification ADC doit porter le scope
 * "indexing", sinon toutes les demandes echouent en "insufficient scopes" :
 *   gcloud auth application-default login \
 *     --scopes="https://www.googleapis.com/auth/indexing,https://www.googleapis.com/auth/cloud-platform"
 *
 * VERIFICATION PRE-VOL (lecon du 06/06/2026) : on refuse de pinger une URL qui
 * repond autre chose que 404, sinon on demande a Google de retirer une page
 * encore en ligne.
 *
 *   npx tsx scripts/_desindexer-url.ts <url>
 */
import { google } from "googleapis";

const url = process.argv[2];
if (!url) { console.error("usage: npx tsx scripts/_desindexer-url.ts <url>"); process.exit(1); }

(async () => {
  const r = await fetch(url, { method: "GET", redirect: "manual" });
  console.log(`controle prealable : ${url} repond ${r.status}`);
  if (r.status !== 404 && r.status !== 410) {
    console.error("REFUS : la page ne renvoie pas 404/410. On ne demande pas le retrait d'une page en ligne.");
    process.exit(1);
  }
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  const client = await auth.getClient();
  const res = await google.indexing({ version: "v3", auth: client as never }).urlNotifications.publish({
    requestBody: { url, type: "URL_DELETED" },
  });
  console.log("demande de retrait envoyee :", JSON.stringify(res.data, null, 2));
})().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
