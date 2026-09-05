import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main(){
  // Catégories clim / chauffage
  const { data: cats } = await sb.from("categories").select("id, name, slug, vertical").or("slug.ilike.%clim%,name.ilike.%clim%,slug.ilike.%chauff%,name.ilike.%chauff%,slug.ilike.%froid%");
  console.log("══ Catégories clim/chauffage ══");
  for (const c of cats||[]) console.log(`  #${c.id} ${c.name} (${c.slug}) [${c.vertical}]`);
  const clim = (cats||[]).find(c=>/clim/i.test(c.slug));
  if(!clim){ console.log("Pas de catégorie clim."); return; }

  // Pros climaticien
  const { count: total } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",clim.id).eq("is_active",true).is("deleted_at",null);
  const { count: claimed } = await sb.from("pros").select("id",{count:"exact",head:true}).eq("category_id",clim.id).eq("is_active",true).is("deleted_at",null).not("claimed_by_user_id","is",null);
  console.log(`\n══ Pros "${clim.name}" (#${clim.id}) ══\n  Total actifs : ${total} | Réclamés : ${claimed}`);

  // Pages SEO climaticien
  const { count: seo } = await sb.from("seo_pages").select("id",{count:"exact",head:true}).eq("category_id",clim.id);
  console.log(`\n══ Pages SEO climaticien : ${seo} ══`);

  // Guides des prix contenant clim
  const { data: guides } = await sb.from("seo_guides").select("slug, title").or("slug.ilike.%clim%,title.ilike.%clim%,slug.ilike.%pompe%chaleur%,title.ilike.%climatisation%").limit(20);
  console.log(`\n══ Guides prix clim/PAC (${guides?.length||0}) ══`);
  for (const g of guides||[]) console.log(`  ${g.slug} · ${g.title}`);

  // Projets jamais déposés en climaticien
  const { count: projAll } = await sb.from("projects").select("id",{count:"exact",head:true}).eq("category_id",clim.id).neq("status","deleted");
  const since = new Date(Date.now()-30*86400e3).toISOString();
  const { count: proj30 } = await sb.from("projects").select("id",{count:"exact",head:true}).eq("category_id",clim.id).neq("status","deleted").gte("created_at",since);
  console.log(`\n══ PROJETS climaticien déposés : ${projAll} au total, ${proj30} sur 30j ══`);
}
main().catch(e=>{console.error(e.message);process.exit(1);});
