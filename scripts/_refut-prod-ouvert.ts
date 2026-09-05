import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const rows = JSON.parse(fs.readFileSync("/private/tmp/gsc/p_r28_full.json","utf8"));
  const fiches = new Map<string,{imp:number;cl:number}>();
  for (const r of rows) { const p=r.keys[0].replace("https://workwave.fr","").split("?")[0];
    if (p.startsWith("/artisan/")) fiches.set(p.replace("/artisan/","").replace(/\/$/,""), {imp:r.impressions, cl:r.clicks}); }
  // on prend TOUTES les fiches ayant au moins 1 clic + un echantillon des autres
  const avecClic = [...fiches].filter(([,v])=>v.cl>0).map(([s])=>s);
  const sansClic = [...fiches].filter(([,v])=>v.cl===0).map(([s])=>s).sort(()=>Math.random()-0.5).slice(0,4000);
  const etat = new Map<string,string>();
  for (const lot of [avecClic, sansClic]) for (let i=0;i<lot.length;i+=300) {
    const { data } = await sb.from("pros").select("slug,etat_admin").in("slug", lot.slice(i,i+300));
    for (const d of data||[]) etat.set(d.slug, d.etat_admin==="F"?"F":"A");
  }
  const agg:Record<string,{n:number;imp:number;cl:number}> = {A:{n:0,imp:0,cl:0},F:{n:0,imp:0,cl:0}};
  for (const s of avecClic) { const e=etat.get(s); if(!e)continue; const v=fiches.get(s)!;
    agg[e].n++; agg[e].imp+=v.imp; agg[e].cl+=v.cl; }
  console.log("=== H. LES FICHES QUI CLIQUENT SONT-ELLES OUVERTES OU FERMEES ? ===");
  console.log(`  (toutes les ${avecClic.length} fiches ayant >=1 clic sur 28j)`);
  const T=agg.A.cl+agg.F.cl;
  console.log(`  OUVERTES : ${String(agg.A.n).padStart(5)} fiches | ${String(agg.A.cl).padStart(5)} clics = ${(100*agg.A.cl/T).toFixed(1)}% | ${(agg.A.cl/agg.A.n).toFixed(2)} clic/fiche`);
  console.log(`  FERMEES  : ${String(agg.F.n).padStart(5)} fiches | ${String(agg.F.cl).padStart(5)} clics = ${(100*agg.F.cl/T).toFixed(1)}% | ${(agg.F.cl/agg.F.n).toFixed(2)} clic/fiche`);

  // production unitaire par etat, sur base exposee estimee
  let sA=0,sF=0; for(const s of sansClic){const e=etat.get(s); if(e==="A")sA++; else if(e==="F")sF++;}
  const partA=(sA)/(sA+sF);
  const exposA = agg.A.n + Math.round((fiches.size-avecClic.length)*partA);
  const exposF = agg.F.n + Math.round((fiches.size-avecClic.length)*(1-partA));
  console.log(`\n  fiches exposees estimees : ${exposA} ouvertes / ${exposF} fermees`);
  console.log(`  PRODUCTION UNITAIRE d une fiche OUVERTE exposee : ${(agg.A.cl/exposA).toFixed(4)} clic/28j`);
  console.log(`  PRODUCTION UNITAIRE d une fiche FERMEE  exposee : ${(agg.F.cl/exposF).toFixed(4)} clic/28j`);
  console.log(`  (l audit utilise 0.1289 pour toutes)`);
})().catch(e=>console.error(e.message));
