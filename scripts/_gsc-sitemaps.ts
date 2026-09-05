/** Etat des sitemaps declares dans Search Console : Google les lit-il ? */
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.sitemaps.list({ siteUrl: SITE });
  const s = r.data.sitemap || [];
  console.log(`${s.length} sitemap(s) declare(s) dans Search Console\n`);
  for (const x of s as any[]) {
    console.log(`  ${x.path}`);
    console.log(`    type ${x.type} · dernier telechargement par Google : ${x.lastDownloaded || "JAMAIS"}`);
    console.log(`    derniere soumission : ${x.lastSubmitted || "?"} · en attente : ${x.isPending} · erreurs : ${x.errors || 0} · avertissements : ${x.warnings || 0}`);
    for (const c of x.contents || []) console.log(`    ${c.type} : ${c.submitted} soumises, ${c.indexed ?? "?"} indexees`);
  }
})();
