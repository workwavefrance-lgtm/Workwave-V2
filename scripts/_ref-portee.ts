import { google } from "googleapis";
import fs from "fs";
const SITE = "https://workwave.fr/";
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const S = "2026-08-07", E = "2026-09-03";
  const r = await sc.searchanalytics.query({ siteUrl: SITE, requestBody: { startDate: S, endDate: E, dimensions: [] } });
  const t = r.data.rows![0];
  console.log(`SITE ENTIER ${S} -> ${E} : ${t.impressions} impressions, ${t.clicks} clics (${((t.clicks as number)/28).toFixed(0)} clics/jour)`);
  const out:any[] = JSON.parse(fs.readFileSync("/tmp/desc-out.json","utf8"));
  const pages:any[] = JSON.parse(fs.readFileSync("/tmp/listing-pages.json","utf8"));
  const impListing = pages.reduce((s,x)=>s+x.i,0), cliListing = pages.reduce((s,x)=>s+x.c,0);
  const top = out.reduce((s,x)=>s+x.i,0), topc = out.reduce((s,x)=>s+x.c,0);
  const un = out.filter(x=>x.n===1);
  const impUn = un.reduce((s,x)=>s+x.i,0), cliUn = un.reduce((s,x)=>s+x.c,0);
  // extrapolation : on suppose la meme part dans la queue non curlee
  const partImp = impUn/top, partCli = cliUn/topc;
  console.log(`\nPages listing ville : ${impListing} imp = ${(100*impListing/(t.impressions as number)).toFixed(1)}% du site | ${cliListing} clics = ${(100*cliListing/(t.clicks as number)).toFixed(1)}% du site`);
  console.log(`Pages a 1 pro, MESURE sur le top 300 : ${impUn} imp, ${cliUn} clics`);
  console.log(`  -> part du SITE, mesuree (sans extrapoler) : ${(100*impUn/(t.impressions as number)).toFixed(2)}% des impressions, ${(100*cliUn/(t.clicks as number)).toFixed(2)}% des clics`);
  console.log(`  -> si on extrapole la meme part a toute la queue listing : ${(partImp*impListing).toFixed(0)} imp (${(100*partImp*impListing/(t.impressions as number)).toFixed(2)}% du site), ${(partCli*cliListing).toFixed(0)} clics (${(100*partCli*cliListing/(t.clicks as number)).toFixed(2)}% du site) sur 28 j`);
  console.log(`  -> soit ${(partCli*cliListing/28).toFixed(1)} clics/jour concernes AU TOTAL (pas le gain : le trafic total de ces pages)`);
}
main().catch(e=>console.error(e.message));
