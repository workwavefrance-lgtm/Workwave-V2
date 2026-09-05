import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main(){
  // Guides prix contenant pompe à chaleur / PAC
  const { data: g } = await sb.from("seo_guides").select("slug, title")
    .or("slug.ilike.%pompe%,slug.ilike.%-pac-%,slug.ilike.%chaleur%,title.ilike.%pompe à chaleur%,title.ilike.%PAC%").limit(20);
  console.log(`══ Guides prix PAC/pompe à chaleur (${g?.length||0}) ══`);
  for(const x of g||[]) console.log(`  /guide-des-prix/${x.slug} · ${x.title}`);

  // Pages SEO chauffagiste (le métier qui pose les PAC air-eau)
  const { data: cat } = await sb.from("categories").select("id").eq("slug","chauffagiste").single();
  const { count: seoChauff } = await sb.from("seo_pages").select("id",{count:"exact",head:true}).eq("category_id",cat!.id);
  console.log(`\n══ Pages SEO chauffagiste : ${seoChauff} ══`);

  // Blog articles PAC
  const { data: blog } = await sb.from("blog_posts").select("slug, title")
    .or("slug.ilike.%pompe%,slug.ilike.%chaleur%,title.ilike.%pompe à chaleur%").limit(10);
  console.log(`\n══ Articles blog PAC (${blog?.length||0}) ══`);
  for(const b of blog||[]) console.log(`  /blog/${b.slug}`);
}
main().catch(e=>{console.error(e.message);process.exit(1);});
