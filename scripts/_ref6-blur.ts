import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main(){
  const gsc = JSON.parse(fs.readFileSync("/tmp/artisan-gsc.json","utf8"));
  const db = JSON.parse(fs.readFileSync("/tmp/artisan-db.json","utf8"));
  const cl = new Map(gsc.map((g:any)=>[g.slug,g.c]));
  const avecContact = db.filter((r:any)=>r.phone||r.email||r.website).map((r:any)=>r.slug);
  console.log("fiches a trafic avec >=1 coordonnee en base :", avecContact.length);
  let claimed=0, clicsClaimed=0, clicsAvecContact=0;
  for (let k=0;k<avecContact.length;k+=300){
    const { data } = await sb.from("pros").select("slug,claimed_by_user_id").in("slug", avecContact.slice(k,k+300));
    for (const r of data??[]) { const c=(cl.get(r.slug) as number)||0; clicsAvecContact+=c; if (r.claimed_by_user_id){claimed++; clicsClaimed+=c;} }
  }
  console.log("dont RECLAMEES (donc coordonnees affichees en clair) :", claimed);
  console.log("clics sur fiches a coordonnees :", clicsAvecContact, "| dont sur fiches reclamees :", clicsClaimed);
  const totalClics = gsc.reduce((s:number,g:any)=>s+g.c,0);
  console.log(`\nCLICS ARRIVANT SUR UNE PAGE AFFICHANT UN LIEN tel:/mailto: REEL : ${clicsClaimed}/${totalClics} = ${(100*clicsClaimed/totalClics).toFixed(3)}%`);
  const { count } = await sb.from("pros").select("*",{count:"exact",head:true}).not("claimed_by_user_id","is",null);
  console.log("total fiches reclamees sur tout le site :", count);
}
main().catch(e=>console.error(e.message));
