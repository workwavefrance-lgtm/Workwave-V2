import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const slugs = fs.readFileSync(process.argv[2], "utf8").split("\n").map(s=>s.trim()).filter(Boolean);
  // separer ouverts / fermes
  const fermes: string[] = [], ouverts: string[] = [];
  for (let i=0;i<slugs.length;i+=200) {
    const { data } = await sb.from("pros").select("slug, etat_admin").in("slug", slugs.slice(i,i+200));
    for (const r of data||[]) (r.etat_admin === "F" ? fermes : ouverts).push(r.slug);
  }
  const pick = (a: string[], n: number) => { const o=[]; for(let i=0;i<n;i++) o.push(a[Math.floor(i*a.length/n)]); return o; };
  const ech = [...pick(fermes, 8).map(s=>["FERME", s] as const), ...pick(ouverts, 8).map(s=>["OUVERT", s] as const)];
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const SITE = "https://workwave.fr/";
  const compte: Record<string, Record<string, number>> = { FERME: {}, OUVERT: {} };
  let sitemapCite = 0;
  for (const [etat, slug] of ech) {
    const u = `https://workwave.fr/artisan/${slug}`;
    try {
      const { data } = await sc.urlInspection.index.inspect({ requestBody: { inspectionUrl: u, siteUrl: SITE } });
      const r: any = data.inspectionResult?.indexStatusResult || {};
      const cs = r.coverageState || "?";
      compte[etat][cs] = (compte[etat][cs] || 0) + 1;
      const sm = r.sitemap ? JSON.stringify(r.sitemap) : "AUCUN";
      if (r.sitemap) sitemapCite++;
      console.log(`${etat.padEnd(6)} ${slug.slice(0,40).padEnd(42)} ${cs.padEnd(34)} crawl=${(r.lastCrawlTime||"jamais").slice(0,10)} sitemap=${sm} referent=${r.referringUrls ? "oui":"non"}`);
    } catch (e:any) { console.log(`${etat} ${slug} ECHEC ${String(e.message).slice(0,80)}`); }
  }
  console.log("\nRESUME");
  for (const k of ["FERME","OUVERT"]) console.log(`  ${k} :`, JSON.stringify(compte[k]));
  console.log(`  URLs dont GSC dit qu'elles viennent d'un sitemap : ${sitemapCite}/${ech.length}`);
})();
