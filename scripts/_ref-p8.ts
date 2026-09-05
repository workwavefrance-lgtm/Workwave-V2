import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { google } from "googleapis";
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const DENSES = ["75","69","13","59","33","31","06","44","34","76"];
(async () => {
  const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/webmasters.readonly"] });
  const sc = google.searchconsole({ version: "v1", auth });
  const r = await sc.searchanalytics.query({ siteUrl: "https://workwave.fr/", requestBody: {
    startDate: "2026-08-05", endDate: "2026-09-02", dimensions: ["page"], rowLimit: 25000,
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: "/artisan/" }] }] } });
  const avecClics = (r.data.rows||[]).filter(x=>(x.clicks||0)>0);
  console.log(`fiches /artisan/ avec >=1 clic sur 29 j : ${avecClics.length} (total clics ${avecClics.reduce((a,x)=>a+(x.clicks||0),0)})`);
  const map = new Map<string,number>();
  for (const x of avecClics) { const s = decodeURIComponent(x.keys![0]).split("/artisan/")[1]?.split("?")[0]; if (s) map.set(s,(map.get(s)||0)+(x.clicks||0)); }
  const slugs=[...map.keys()];
  // departements denses -> ids de villes
  const { data: deps } = await sb.from("departments").select("id,code").in("code",DENSES);
  const depIds = new Set((deps??[]).map(d=>d.id));
  const villesDenses = new Set<number>();
  for (const d of deps??[]) { const { data: cs } = await sb.from("cities").select("id").eq("department_id", d.id); for (const c of cs??[]) villesDenses.add(c.id); }
  let clicsDenses=0, clicsAutres=0, introuvables=0;
  for (let i=0;i<slugs.length;i+=200) {
    const lot=slugs.slice(i,i+200);
    const { data } = await sb.from("pros").select("slug,city_id").in("slug",lot);
    const trouve=new Map((data??[]).map(p=>[p.slug,p.city_id]));
    for (const s of lot) { const cid=trouve.get(s); const cl=map.get(s)||0;
      if (cid===undefined) introuvables+=cl; else if (villesDenses.has(cid as number)) clicsDenses+=cl; else clicsAutres+=cl; }
  }
  // denominateurs : nb de fiches en base
  let nbDenses=0;
  for (const d of deps??[]) { const { data: cs } = await sb.from("cities").select("id").eq("department_id", d.id);
    const ids=(cs??[]).map(c=>c.id);
    const { count } = await sb.from("pros").select("id",{count:"exact",head:true}).in("city_id",ids).is("deleted_at",null).eq("is_active",true);
    nbDenses+=count||0; }
  console.log(`\nclics sur fiches des 10 depts DENSES : ${clicsDenses}`);
  console.log(`clics sur fiches AILLEURS             : ${clicsAutres}`);
  console.log(`clics non rattachables (slug absent)  : ${introuvables}`);
  console.log(`\nfiches en base dans les 10 depts denses : ${nbDenses}`);
  console.log(`rendement mesure d une fiche en zone dense : ${(clicsDenses/29/Math.max(nbDenses,1)).toExponential(2)} clic/jour/fiche`);
  console.log(`-> 37 270 fiches plombier ajoutees en zone dense : ${(37270*clicsDenses/29/Math.max(nbDenses,1)).toFixed(2)} clic/jour`);
})();
