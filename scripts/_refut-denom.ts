import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { count: ouv } = await sb.from("pros").select("id",{count:"exact",head:true})
    .eq("is_active",true).is("deleted_at",null).neq("etat_admin","F");
  const { count: tot } = await sb.from("pros").select("id",{count:"exact",head:true})
    .eq("is_active",true).is("deleted_at",null);
  console.log(`fiches actives TOTAL   : ${tot}`);
  console.log(`fiches actives OUVERTES: ${ouv}  (chiffre audit : 1 233 038)`);

  // Les fiches EXPOSEES sont-elles ouvertes ? (le numerateur de l audit)
  const rows = JSON.parse(fs.readFileSync("/private/tmp/gsc/p_r28_full.json","utf8"));
  const slugs: string[] = [];
  for (const r of rows) { const p=r.keys[0].replace("https://workwave.fr","").split("?")[0];
    if (p.startsWith("/artisan/")) slugs.push(p.replace("/artisan/","").replace(/\/$/,"")); }
  console.log(`\nfiches exposees dans GSC : ${slugs.length}`);
  // echantillon de 3000 slugs exposes -> etat reel
  const ech = slugs.sort(()=>Math.random()-0.5).slice(0,3000);
  let A=0,F=0,absent=0;
  for (let i=0;i<ech.length;i+=300) {
    const { data } = await sb.from("pros").select("slug,etat_admin").in("slug", ech.slice(i,i+300));
    const vus = new Set((data||[]).map(d=>d.slug));
    for (const d of data||[]) { if (d.etat_admin==="F") F++; else A++; }
    for (const s of ech.slice(i,i+300)) if (!vus.has(s)) absent++;
  }
  const n=A+F+absent;
  console.log(`\n=== ETAT REEL DES FICHES QUE GOOGLE EXPOSE (echantillon ${n}) ===`);
  console.log(`  OUVERTES : ${A} = ${(100*A/n).toFixed(1)}%`);
  console.log(`  FERMEES  : ${F} = ${(100*F/n).toFixed(1)}%`);
  console.log(`  absentes/supprimees : ${absent} = ${(100*absent/n).toFixed(1)}%`);
  const ouvExp = Math.round(slugs.length * A/n);
  console.log(`\n  => fiches OUVERTES reellement exposees ~= ${ouvExp} (et non ${slugs.length})`);
  console.log(`  => taux d exposition des fiches ouvertes = ${(100*ouvExp/(ouv||1)).toFixed(2)}% (audit : 5.50%)`);
})().catch(e=>console.error(e.message));
