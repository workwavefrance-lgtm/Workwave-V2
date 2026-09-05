import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
type G = { slug:string; c:number; i:number; pos:number };
async function main() {
  const gsc: G[] = JSON.parse(fs.readFileSync("/tmp/artisan-gsc.json","utf8"));
  const bySlug = new Map(gsc.map(g=>[g.slug,g]));
  const slugs = [...bySlug.keys()];
  const cols = "slug,phone,email,website,description,photos,founded_year,rge_certified,google_rating,google_reviews_count,claimed_by_user_id,etat_admin,is_active,deleted_at,forme_juridique,effectif_range,founding_date";
  const found: any[] = [];
  const B = 400;
  for (let k=0;k<slugs.length;k+=B) {
    const { data, error } = await sb.from("pros").select(cols).in("slug", slugs.slice(k,k+B));
    if (error) { console.log("ERR", error.message); break; }
    found.push(...(data??[]));
    if (k % 8000 === 0) process.stderr.write(`  ${k}/${slugs.length}\r`);
  }
  console.log(`\nfiches GSC : ${slugs.length} | retrouvees en base : ${found.length}`);
  const hasC = (r:any)=> !!r.phone || !!r.email || !!r.website;
  let nC=0, cC=0, iC=0, nTot=0, cTot=0, iTot=0;
  let nPhone=0, cPhone=0, iPhone=0;
  const stat = { rge:0, fy:0, photos:0, grating:0, claimed:0, desc:0, ferme:0, legal:0, staff:0, fdate:0 };
  for (const r of found) {
    const g = bySlug.get(r.slug)!; if (!g) continue;
    nTot++; cTot+=g.c; iTot+=g.i;
    if (hasC(r)) { nC++; cC+=g.c; iC+=g.i; }
    if (r.phone) { nPhone++; cPhone+=g.c; iPhone+=g.i; }
    if (r.rge_certified) stat.rge++;
    if (r.founded_year) stat.fy++;
    if (Array.isArray(r.photos)&&r.photos.length>0) stat.photos++;
    if (r.google_rating!=null) stat.grating++;
    if (r.claimed_by_user_id) stat.claimed++;
    if (r.description) stat.desc++;
    if (r.etat_admin==="F") stat.ferme++;
    if (r.forme_juridique) stat.legal++;
    if (r.effectif_range) stat.staff++;
    if (r.founding_date) stat.fdate++;
  }
  const p=(a:number,b:number)=>`${a}/${b} = ${(100*a/Math.max(b,1)).toFixed(2)}%`;
  console.log("\n=== SUR LES FICHES QUI RECOIVENT DU TRAFIC (denominateur reel) ===");
  console.log("au moins 1 moyen de contact, par PAGE       :", p(nC,nTot));
  console.log("au moins 1 moyen de contact, pondere CLICS  :", p(cC,cTot));
  console.log("au moins 1 moyen de contact, pondere IMPR   :", p(iC,iTot));
  console.log("telephone present, pondere CLICS            :", p(cPhone,cTot));
  console.log("telephone present, par PAGE                 :", p(nPhone,nTot));
  console.log("\n--- autres champs, par page (fiches a trafic) ---");
  for (const [k,v] of Object.entries(stat)) console.log(k.padEnd(10), p(v,nTot));
}
main().catch(e=>console.error(e.message));
