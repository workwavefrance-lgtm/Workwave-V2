import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data: cats } = await sb.from("categories").select("slug,vertical").in("vertical", ["btp","domicile","personne"]);
  const metiers = new Set((cats||[]).map((c:any)=>c.slug));
  console.log("metiers btp/domicile/personne :", metiers.size);
  // combos de la vue
  const combos = new Set<string>(); let off = 0;
  while (true) {
    const { data } = await (sb as any).rpc("sitemap_listings_page", { p_offset: off, p_limit: 20000 });
    const rows = (data||[]) as {m:string;v:string;n:number}[]; if (!rows.length) break;
    for (const r of rows) combos.add(`${r.m}/${r.v}`);
    off += rows.length; if (rows.length < 20000) break;
  }
  console.log("combos vue :", combos.size);
  // sitemap declare
  const declared = new Set(fs.readFileSync("/tmp/sm2urls.txt","utf8").trim().split("\n"));
  console.log("declares sitemap/2 :", declared.size);

  const gsc = JSON.parse(fs.readFileSync("/tmp/gsc-pages-aout.json","utf8"));
  const stat = { listing:{p:0,i:0,c:0}, listDecl:{p:0,i:0,c:0}, listNonDecl:{p:0,i:0,c:0}, listHorsVue:{p:0,i:0,c:0} };
  const impParCombo = new Map<string, {i:number;c:number}>();
  for (const row of gsc) {
    const u = String(row.keys[0]).replace(/^https:\/\/workwave\.fr\//,"").replace(/\/$/,"").split("?")[0];
    const seg = u.split("/");
    if (seg.length !== 2) continue;
    if (!metiers.has(seg[0])) continue;
    if (/-\d{2,3}$/.test(seg[1])) continue; // page departement
    const i = row.impressions||0, c = row.clicks||0;
    stat.listing.p++; stat.listing.i+=i; stat.listing.c+=c;
    impParCombo.set(u, {i,c});
    if (declared.has(u)) { stat.listDecl.p++; stat.listDecl.i+=i; stat.listDecl.c+=c; }
    else if (combos.has(u)) { stat.listNonDecl.p++; stat.listNonDecl.i+=i; stat.listNonDecl.c+=c; }
    else { stat.listHorsVue.p++; stat.listHorsVue.i+=i; stat.listHorsVue.c+=c; }
  }
  const f = (k:string,s:any)=>console.log(`${k.padEnd(28)} pages ${String(s.p).padStart(6)} | imp ${String(s.i).padStart(7)} | clics ${String(s.c).padStart(5)} | clics/page/mois ${(s.c/(s.p||1)).toFixed(4)}`);
  f("metier x ville (total)", stat.listing);
  f("  dont DECLARES sitemap", stat.listDecl);
  f("  dont non declares (vue)", stat.listNonDecl);
  f("  dont hors vue (<3 pros)", stat.listHorsVue);
  // combien de combos de la vue non declares ont deja des impressions
  let vueNonDecl = 0, vueNonDeclAvecImp = 0;
  for (const k of combos) if (!declared.has(k)) { vueNonDecl++; if (impParCombo.has(k)) vueNonDeclAvecImp++; }
  console.log(`\ncombos vue NON declares : ${vueNonDecl} ; dont deja des impressions en aout : ${vueNonDeclAvecImp} (${(100*vueNonDeclAvecImp/vueNonDecl).toFixed(1)}%)`);
  console.log(`combos vue declares : ${combos.size - vueNonDecl}`);
  // distribution des clics des non declares
  const arr = [...combos].filter(k=>!declared.has(k)).map(k=>impParCombo.get(k)?.c||0);
  console.log(`clics aout sur les non declares : ${arr.reduce((a,b)=>a+b,0)}`);
})().catch(e => { console.error(e.message); process.exit(1); });
