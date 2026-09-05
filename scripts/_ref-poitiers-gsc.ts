import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data: ville } = await sb.from("cities").select("id").eq("slug", "poitiers").limit(1);
  const { data: cat } = await sb.from("categories").select("id").eq("slug", "plombier").limit(1);
  const { data: pros } = await sb.from("pros").select("slug")
    .eq("city_id", (ville as any)[0].id).eq("category_id", (cat as any)[0].id)
    .eq("is_active", true).is("deleted_at", null).eq("etat_admin", "A").limit(60);
  const slugs = (pros as any[]).map(p => p.slug);
  // les 5 cibles concentrees mesurees
  const cibles = new Set(["aboubakr-mahiedddine-00017","karim-ouelhadj-00014","abdelaziz-azir-00011","viveo-environnement-00016","mourad-saghi-00027"]);

  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth: (await auth.getClient()) as never });
  const res: Record<string, {c:number;i:number}> = {};
  for (const s of slugs) {
    const { data } = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
      startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 5,
      dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "equals", expression: `https://workwave.fr/artisan/${s}` }] }] } });
    const r = (data.rows || [])[0];
    res[s] = { c: r?.clicks || 0, i: r?.impressions || 0 };
  }
  let avecImp = 0, avecImpNonCible = 0, nonCible = 0;
  for (const s of slugs) {
    const est = cibles.has(s);
    if (!est) nonCible++;
    if (res[s].i > 0) { avecImp++; if (!est) avecImpNonCible++; }
  }
  console.log(`27 plombiers ouverts de Poitiers, GSC 05/08 -> 01/09 :`);
  console.log(`  fiches avec au moins 1 impression : ${avecImp}/${slugs.length}`);
  console.log(`  parmi les 22 fiches qui ne recoivent AUCUN lien de leurs voisines : ${avecImpNonCible}/${nonCible} ont des impressions`);
  console.log(`  impressions des 5 fiches "concentrees" : ${[...cibles].map(s=>`${s}=${res[s]?.i??"?"}`).join(", ")}`);
  const total = slugs.reduce((s,x)=>s+res[x].i,0);
  console.log(`  impressions totales du lot : ${total}, clics totaux : ${slugs.reduce((s,x)=>s+res[x].c,0)}`);
})();
