import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
type G = { slug:string; c:number; i:number };
async function main() {
  const gsc: G[] = JSON.parse(fs.readFileSync("/tmp/artisan-gsc.json","utf8"));
  const bySlug = new Map(gsc.map(g=>[g.slug,g]));
  const slugs = [...bySlug.keys()];
  const cols = "slug,phone,email,website,etat_admin,forme_juridique,effectif_range,founding_date,rge_certified,is_active,deleted_at";
  const found: any[] = [];
  const B = 300;
  for (let k=0;k<slugs.length;k+=B) {
    let ok=false;
    for (let t=0;t<4 && !ok;t++) {
      try { const { data, error } = await sb.from("pros").select(cols).in("slug", slugs.slice(k,k+B)).abortSignal(AbortSignal.timeout(30000));
        if (error) throw new Error(error.message); found.push(...(data??[])); ok=true;
      } catch(e:any){ if(t===3) console.log("skip batch",k,e.message); await new Promise(r=>setTimeout(r,1500)); }
    }
    if (k % 9000 === 0) process.stderr.write(`  ${k}/${slugs.length}\r`);
  }
  fs.writeFileSync("/tmp/artisan-db.json", JSON.stringify(found));
  const grp = { ouvert: {n:0,c:0,i:0,ct:0,cc:0,ci:0}, ferme: {n:0,c:0,i:0,ct:0,cc:0,ci:0} };
  for (const r of found) {
    const g = bySlug.get(r.slug); if (!g) continue;
    const k = r.etat_admin === "F" ? "ferme" : "ouvert";
    grp[k].n++; grp[k].c+=g.c; grp[k].i+=g.i;
    if (r.phone||r.email||r.website) { grp[k].ct++; grp[k].cc+=g.c; grp[k].ci+=g.i; }
  }
  const p=(a:number,b:number)=>`${(100*a/Math.max(b,1)).toFixed(2)}%`;
  console.log(`\nretrouvees en base : ${found.length}/${slugs.length}`);
  for (const [k,v] of Object.entries(grp)) {
    console.log(`\n--- ${k.toUpperCase()} : ${v.n} pages | ${v.c} clics | ${v.i} impressions`);
    console.log(`    avec >=1 moyen de contact : ${v.ct} pages (${p(v.ct,v.n)}) | ${v.cc} clics (${p(v.cc,v.c)}) | ${v.ci} impr (${p(v.ci,v.i)})`);
  }
  const tc = grp.ouvert.c+grp.ferme.c, ti = grp.ouvert.i+grp.ferme.i, tn=grp.ouvert.n+grp.ferme.n;
  console.log(`\nPART DES CLICS QUI VONT SUR UNE FICHE FERMEE : ${grp.ferme.c}/${tc} = ${p(grp.ferme.c,tc)}`);
  console.log(`PART DES IMPRESSIONS SUR FICHE FERMEE        : ${p(grp.ferme.i,ti)}`);
  console.log(`PART DES PAGES A TRAFIC QUI SONT FERMEES     : ${p(grp.ferme.n,tn)}`);
}
main().catch(e=>console.error(e.message));
