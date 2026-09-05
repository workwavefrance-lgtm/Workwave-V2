import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const { data } = await sc.sitemaps.list({ siteUrl: "https://workwave.fr/" });
  for (const s of data.sitemap || []) {
    const w: any = (s.contents||[])[0]||{};
    console.log(`${s.path}\n   dernier telechargement Google = ${s.lastDownloaded ? s.lastDownloaded.slice(0,10) : "JAMAIS"} | soumis=${s.lastSubmitted?.slice(0,10)} | erreurs=${s.errors} | avertissements=${s.warnings} | soumis:${w.submitted} indexes:${w.indexed}`);
  }
})();
