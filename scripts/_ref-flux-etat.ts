import * as dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const slugs = fs.readFileSync("/tmp/slugs.txt","utf8").trim().split("\n");
  const out: any[] = [];
  for (let i=0;i<slugs.length;i+=500) {
    const { data, error } = await sb.from("pros")
      .select("slug, etat_admin, entreprise_etat, claimed_by_user_id, description, phone, updated_at")
      .in("slug", slugs.slice(i,i+500));
    if (error) throw new Error(error.message);
    out.push(...(data||[]));
  }
  const n = out.length;
  const f = out.filter(p=>p.etat_admin==="F").length;
  const a = out.filter(p=>p.etat_admin==="A").length;
  const nul = out.filter(p=>!p.etat_admin).length;
  const cess = out.filter(p=>p.entreprise_etat==="C").length;
  const claimed = out.filter(p=>p.claimed_by_user_id).length;
  const avecDesc = out.filter(p=>p.description && p.description.length>50).length;
  const avecTel = out.filter(p=>p.phone).length;
  console.log(`fiches du flux retrouvees en base : ${n} / ${slugs.length}`);
  console.log(`  etablissement FERME (etat_admin=F) : ${f}  (${(100*f/n).toFixed(1)} %)`);
  console.log(`  etablissement OUVERT (A)           : ${a}  (${(100*a/n).toFixed(1)} %)`);
  console.log(`  etat_admin non renseigne           : ${nul}`);
  console.log(`  entreprise CESSEE (C)              : ${cess}  (${(100*cess/n).toFixed(1)} %)`);
  console.log(`  fiches RECLAMEES par un pro        : ${claimed}`);
  console.log(`  avec description > 50 car.         : ${avecDesc}`);
  console.log(`  avec telephone                     : ${avecTel}`);
})();
