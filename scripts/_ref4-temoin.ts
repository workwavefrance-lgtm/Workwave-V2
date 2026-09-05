import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
async function main(){
  const { data } = await sb.from("pros").select("slug,name,phone,email,website,etat_admin,forme_juridique,effectif_range,founding_date,founded_year,rge_certified,photos,google_rating,claimed_by_user_id").eq("slug","pascal-bara-00026");
  console.log("=== FICHE TEMOIN DE L AUDIT ===");
  console.log(JSON.stringify(data?.[0],null,1));
  // top fiches fermees par clics
  const gsc = JSON.parse(fs.readFileSync("/tmp/artisan-gsc.json","utf8"));
  const db = JSON.parse(fs.readFileSync("/tmp/artisan-db.json","utf8"));
  const cl = new Map(gsc.map((g:any)=>[g.slug,g.c]));
  const fermes = db.filter((r:any)=>r.etat_admin==="F").map((r:any)=>({slug:r.slug,c:cl.get(r.slug)||0})).sort((a:any,b:any)=>b.c-a.c).slice(0,5);
  console.log("\n=== TOP 5 FICHES FERMEES PAR CLICS ===");
  for (const f of fermes) console.log(`${f.c} clics  https://workwave.fr/artisan/${f.slug}`);
}
main().catch(e=>console.error(e.message));
