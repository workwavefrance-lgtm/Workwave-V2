import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
/* eslint-disable @typescript-eslint/no-explicit-any */
async function cnt(t: string, b: (q: any) => any): Promise<number> {
  const { count } = await b(sb.from(t).select("id", { count: "exact", head: true })); return count || 0;
}
(async () => {
  // Paris / Île-de-France dans la base ?
  const { data: depts } = await sb.from("departments").select("code,name").in("code", ["75","77","78","91","92","93","94","95"]);
  console.log("=== Départements Île-de-France en base ===");
  console.log((depts as any[]).length ? (depts as any[]).map(d=>`${d.code} ${d.name}`).join(" · ") : "AUCUN (Paris/IDF pas scrapés)");
  const { count: parisCities } = await sb.from("cities").select("id",{count:"exact",head:true}).ilike("name","paris%");
  console.log(`Villes 'Paris*' en base : ${parisCities}`);

  // Serrurier (cat 11) : total pros + par dept si dispo
  const { count: serrTotal } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",11).eq("is_active",true).is("deleted_at",null);
  console.log(`\n=== Serrurier (cat 11) ===\nPros serruriers actifs total : ${serrTotal}`);

  // seo_pages : combien, par type, serrurier + menage
  const { count: seoTotal } = await sb.from("seo_pages").select("id",{count:"exact",head:true});
  console.log(`\n=== seo_pages ===\nTotal rows : ${seoTotal}`);
  for (const t of ["metier_ville","metier_dept"]) {
    const c = await cnt("seo_pages",(q)=>q.eq("type",t));
    console.log(`  type=${t}: ${c}`);
  }
  // price_guides serrurier + airbnb/location
  const { data: pgSerr } = await sb.from("price_guides").select("slug").ilike("slug","%serrur%").limit(20);
  console.log(`\n=== price_guides serrurier (${(pgSerr as any[]).length}) ===`);
  (pgSerr as any[]).forEach(p=>console.log("  /guide-des-prix/"+p.slug));
  const { data: pgAir } = await sb.from("price_guides").select("slug").or("slug.ilike.%airbnb%,slug.ilike.%saisonn%,slug.ilike.%location%").limit(20);
  console.log(`=== price_guides airbnb/location (${(pgAir as any[]).length}) ===`);
  (pgAir as any[]).forEach(p=>console.log("  /guide-des-prix/"+p.slug));

  // blog serrurier + menage/airbnb
  const { data: blogSerr } = await sb.from("blog_posts").select("slug").ilike("slug","%serrur%").eq("status","published").limit(20);
  const { data: blogAir } = await sb.from("blog_posts").select("slug").or("slug.ilike.%airbnb%,slug.ilike.%menage%,slug.ilike.%saisonn%").eq("status","published").limit(20);
  console.log(`\n=== blog serrurier (${(blogSerr as any[]).length}) · blog ménage/airbnb (${(blogAir as any[]).length}) ===`);
  (blogSerr as any[]).forEach(p=>console.log("  serr /blog/"+p.slug));
  (blogAir as any[]).forEach(p=>console.log("  airbnb /blog/"+p.slug));
})().catch(e=>console.error("ERR",e.message));
