import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const D="/private/tmp/claude-501/-Users-willygauvrit-Desktop-Workwave-V2/7e7a312b-ad81-47aa-837b-91f556f9fefa/scratchpad/ctr";
(async () => {
  const sb = getServiceClient();
  const rows = JSON.parse(fs.readFileSync(`${D}/p28.json`, "utf8")).filter((r:any)=>r.p.includes("/artisan/"));
  const slugs = rows.map((r:any)=>decodeURIComponent(new URL(r.p).pathname.replace("/artisan/","")));
  console.log("fiches GSC:", slugs.length);
  const map = new Map<string, any>();
  for (let i=0;i<slugs.length;i+=300) {
    const { data, error } = await sb.from("pros")
      .select("slug,etat_admin,google_rating,google_reviews_count,phone,email,website,description,photos,logo_url,claimed_by_user_id,founded_year,rge_certified,forme_juridique")
      .in("slug", slugs.slice(i,i+300));
    if (error) { console.error("ERREUR", error.message); process.exit(1); }
    for (const d of data||[]) map.set(d.slug, d);
    if (i % 15000 === 0) process.stderr.write(`${i} `);
  }
  console.log("\nresolues:", map.size);
  const out = rows.map((r:any)=>{
    const s=decodeURIComponent(new URL(r.p).pathname.replace("/artisan/",""));
    const d=map.get(s);
    if(!d) return { ...r, s, ea:null };
    return { ...r, s, ea:d.etat_admin, gr:d.google_rating, grc:d.google_reviews_count, tel:!!d.phone, mail:!!d.email, web:!!d.website, desc:!!d.description, ph:Array.isArray(d.photos)?d.photos.length:0, logo:!!d.logo_url, cl:!!d.claimed_by_user_id, fy:d.founded_year, rge:d.rge_certified, fj:d.forme_juridique };
  });
  fs.writeFileSync(`${D}/fiches_join.json`, JSON.stringify(out));
  console.log("ok");
})();
