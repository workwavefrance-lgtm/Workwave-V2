/** Google a-t-il seulement enregistre les enfants de notre index ? */
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const INDEX = "https://workwave.fr/sitemap-index.xml";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const enfants = await sc.sitemaps.list({ siteUrl: SITE, sitemapIndex: INDEX });
  const l = (enfants.data.sitemap || []) as any[];
  console.log(`Enfants de l'index enregistres par Google : ${l.length}`);
  for (const x of l.slice(0, 8)) {
    console.log(`  ${x.path} · telecharge ${x.lastDownloaded || "JAMAIS"} · ${(x.contents || []).map((c: any) => `${c.submitted} soumises, ${c.indexed ?? "?"} indexees`).join("")}`);
  }
  const tous = await sc.sitemaps.list({ siteUrl: SITE });
  console.log(`\nSitemaps de premier niveau : ${(tous.data.sitemap || []).length}`);
  for (const x of (tous.data.sitemap || []) as any[]) {
    const c = (x.contents || [])[0];
    console.log(`  ${x.path}`);
    console.log(`     telecharge ${x.lastDownloaded || "JAMAIS"} · ${c ? `${c.submitted} soumises, ${c.indexed ?? "?"} indexees` : "AUCUN CONTENU ENREGISTRE"}`);
  }
})();
