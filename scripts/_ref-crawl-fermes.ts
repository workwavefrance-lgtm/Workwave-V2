import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const slugs = fs.readFileSync(process.argv[2], "utf8").split("\n").map(s=>s.trim()).filter(Boolean);
  console.log(`slugs distincts crawles par Googlebot (66.249.) : ${slugs.length}`);
  let trouves=0, A=0, F=0, nul=0, C=0, claimed=0;
  for (let i=0;i<slugs.length;i+=200) {
    const lot = slugs.slice(i,i+200);
    const { data, error } = await sb.from("pros").select("slug, etat_admin, entreprise_etat, claimed_by_user_id").in("slug", lot);
    if (error) { console.log("ERREUR", error.message); process.exit(1); }
    for (const r of data||[]) { trouves++;
      if (r.etat_admin==="F") F++; else if (r.etat_admin==="A") A++; else nul++;
      if (r.entreprise_etat==="C") C++;
      if (r.claimed_by_user_id) claimed++;
    }
  }
  console.log(`trouves en base : ${trouves} (absents : ${slugs.length-trouves})`);
  console.log(`  A ouvert  : ${A} (${(100*A/trouves).toFixed(1)} %)`);
  console.log(`  F ferme   : ${F} (${(100*F/trouves).toFixed(1)} %)`);
  console.log(`  null      : ${nul}`);
  console.log(`  entreprise cessee C : ${C} (${(100*C/trouves).toFixed(1)} %)`);
  console.log(`  reclamees : ${claimed}`);
  const q = () => sb.from("pros").select("id",{count:"exact",head:true}).eq("is_active",true).is("deleted_at",null);
  const { count: bA } = await q().eq("etat_admin","A");
  const { count: bF } = await q().eq("etat_admin","F");
  const { count: bN } = await q().is("etat_admin",null);
  console.log(`\nBASE actifs : A=${bA} F=${bF} null=${bN} -> part F = ${(100*bF!/(bA!+bF!+bN!)).toFixed(1)} % du total actif`);
})();
