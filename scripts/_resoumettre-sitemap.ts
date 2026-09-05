/**
 * Redemande a Google de relire l'index du sitemap.
 *
 * A faire apres tout changement important de structure : le 05/09 l'index est
 * passe de 67 a 82 tranches, les pages metier x ville de 8 405 a 78 918, et la
 * place reservee aux fiches de 2 160 000 a 2 700 000.
 *
 * NE SOUMETTRE QUE L'INDEX (lecon du 29/04) : soumettre les sous-sitemaps un
 * par un les laisse bloques en « impossible de recuperer » pendant des jours.
 */
import { google } from "googleapis";
const SITE = "https://workwave.fr/";
const INDEX = "https://workwave.fr/sitemap-index.xml";
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const avant = await sc.sitemaps.get({ siteUrl: SITE, feedpath: INDEX });
  console.log(`avant : dernier telechargement par Google le ${(avant.data as any).lastDownloaded || "JAMAIS"}`);
  await sc.sitemaps.submit({ siteUrl: SITE, feedpath: INDEX });
  console.log("index resoumis a Search Console");
  const apres = await sc.sitemaps.get({ siteUrl: SITE, feedpath: INDEX });
  const a: any = apres.data;
  console.log(`apres : soumis le ${a.lastSubmitted}, en attente : ${a.isPending}, erreurs : ${a.errors || 0}`);
})();
