import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async()=>{
  const g=await sb.from("seo_guides").select("id",{count:"exact",head:true});
  const b=await sb.from("blog_posts").select("id",{count:"exact",head:true});
  const sp=await sb.from("seo_pages").select("id",{count:"exact",head:true});
  const c=await sb.from("categories").select("vertical");
  const byV:Record<string,number>={}; for(const x of c.data||[]) byV[x.vertical]=(byV[x.vertical]||0)+1;
  const cities=await sb.from("cities").select("id",{count:"exact",head:true});
  const depts=await sb.from("departments").select("id",{count:"exact",head:true});
  console.log(`guides prix: ${g.count} | articles blog: ${b.count} | seo_pages: ${sp.count}`);
  console.log(`catégories: ${JSON.stringify(byV)} | villes: ${cities.count} | départements: ${depts.count}`);
})().catch(e=>console.error(e.message));
