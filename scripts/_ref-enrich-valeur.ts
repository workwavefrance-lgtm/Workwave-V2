import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main() {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  let all: any[] = [];
  for (let start = 0; start < 200000; start += 25000) {
    const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: { startDate: "2026-08-05", endDate: "2026-09-01", dimensions: ["page"], rowLimit: 25000, startRow: start } });
    const rows = r.data.rows || []; all.push(...rows); if (rows.length < 25000) break;
  }
  const art = all.filter(r => r.keys![0].includes("/artisan/"));
  const slugs = art.map(r => decodeURIComponent(r.keys![0].split("/artisan/")[1]||"").replace(/\/$/,"").split("?")[0]).filter(Boolean);
  const bySlug = new Map<string,any>();
  for (let i=0;i<slugs.length;i+=300) {
    const { data } = await sb.from("pros").select("slug,forme_juridique,effectif_range,city_id,etat_admin").in("slug", slugs.slice(i,i+300));
    for (const r of (data??[])) bySlug.set(r.slug,r);
  }
  let nC=0, fj1000=0, fjNull=0, fjDistinct=0, effNN=0, effOk=0;
  const villes = new Set<number>();
  for (const r of art) {
    const s = decodeURIComponent(r.keys![0].split("/artisan/")[1]||"").replace(/\/$/,"").split("?")[0];
    const p = bySlug.get(s); if (!p) continue;
    const c = r.clicks||0; nC+=c;
    if (p.forme_juridique === "1000") fj1000+=c;
    else if (!p.forme_juridique) fjNull+=c;
    else fjDistinct+=c;
    if (!p.effectif_range || p.effectif_range==="NN") effNN+=c; else effOk+=c;
    if (p.city_id) villes.add(p.city_id);
  }
  const pc=(a:number)=>`${a}/${nC} = ${(100*a/Math.max(nC,1)).toFixed(2)}%`;
  console.log(`clics /artisan/ analyses : ${nC}`);
  console.log(`  forme_juridique = 1000 (entrepreneur individuel, mot a mot identique) : ${pc(fj1000)}`);
  console.log(`  forme_juridique absente                                              : ${pc(fjNull)}`);
  console.log(`  forme_juridique DISTINCTIVE (SAS/SARL/SCI/asso...)                    : ${pc(fjDistinct)}`);
  console.log(`  effectif_range = NN ou absent (rien a afficher)                       : ${pc(effNN)}`);
  console.log(`  effectif_range exploitable                                            : ${pc(effOk)}`);
  console.log(`\nvilles distinctes couvertes par ces fiches : ${villes.size}`);
  const ids=[...villes];
  let cov=0;
  for (let i=0;i<ids.length;i+=500) {
    const { data } = await sb.from("commune_data").select("insee_code").limit(1);
    if (!data) break;
    break;
  }
  // couverture commune_data via jointure cities->insee
  const { data: cd } = await sb.from("cities").select("id,insee_code").in("id", ids.slice(0,1000));
  const insee = (cd??[]).map(c=>c.insee_code).filter(Boolean);
  const { data: cdata } = await sb.from("commune_data").select("insee_code,prix_m2_median,revenu_median").in("insee_code", insee.slice(0,1000));
  const avecPrix = (cdata??[]).filter(x=>x.prix_m2_median!=null).length;
  console.log(`commune_data : sur ${insee.slice(0,1000).length} communes testees, ${cdata?.length??0} ont une ligne, dont ${avecPrix} avec prix_m2_median`);
}
main().catch(e=>console.error(e.message));
