/**
 * Force Google a relire l'index de sitemaps.
 *
 * Constat du 20/08 : Google a telecharge sitemap-index.xml le 11/08, en a tire
 * ZERO adresse, et ne connait AUCUN des 63 sous-sitemaps. La decouverte ne se
 * fait donc que par navigation, ce qui explique les 1,55 million de pages
 * jamais vues.
 *
 * Resoumettre est sans risque : on demande juste une relecture d'un fichier
 * qui repond deja correctement (verifie : 200, 7 104 octets, 0,21 s,
 * 63 enfants, et le premier enfant renvoie 1 845 adresses en 0,24 s).
 */
import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
(async () => {
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/webmasters"],
  });
  const client = await auth.getClient();
  const sc = google.searchconsole({ version: "v1", auth: client as never });
  const site = "https://workwave.fr/";
  const idx = `${site}sitemap-index.xml`;
  try {
    await sc.sitemaps.submit({ siteUrl: site, feedpath: idx });
    console.log("index resoumis :", idx);
  } catch (e) {
    console.error("echec de la resoumission :", (e as Error).message.slice(0, 200));
    console.error("\n-> a faire a la main dans Search Console : Sitemaps, coller");
    console.error("   sitemap-index.xml, puis Envoyer.");
    process.exit(1);
  }
})();
