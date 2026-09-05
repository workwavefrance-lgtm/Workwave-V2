import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
const c = async (t: string, f?: (q: any) => any) => {
  let q = sb.from(t).select("id", { count: "exact", head: true });
  if (f) q = f(q);
  const { count, error } = await q;
  return error ? `ERR ${error.message.slice(0,80)}` : count;
};
(async () => {
  console.log("price_guides           :", await c("price_guides"));
  console.log("blog_posts published   :", await c("blog_posts", q => q.eq("status","published")));
  console.log("seo_guides             :", await c("seo_guides"));
  console.log("seo_pages              :", await c("seo_pages"));
  console.log("categories             :", await c("categories"));
  console.log("cities                 :", await c("cities"));
  console.log("departments            :", await c("departments"));
  console.log("commune_data           :", await c("commune_data"));
  console.log("pro_reviews            :", await c("pro_reviews"));
  console.log("projects total         :", await c("projects"));
  console.log("projects non supprimes :", await c("projects", q => q.neq("status","deleted")));
  // categories par vertical
  const { data: verts } = await sb.from("categories").select("vertical").limit(1000);
  const m = new Map<string, number>(); for (const v of verts||[]) m.set(v.vertical, (m.get(v.vertical)||0)+1);
  console.log("categories par vertical:", [...m].map(([k,v])=>`${k}=${v}`).join(" "));
  // pros ouverts / fermes
  console.log("pros actifs            :", await c("pros", q => q.eq("is_active",true).is("deleted_at",null)));
  console.log("pros OUVERTS (etat A)  :", await c("pros", q => q.eq("is_active",true).is("deleted_at",null).neq("etat_admin","F")));
  console.log("pros avec date_creation:", await c("pros", q => q.eq("is_active",true).is("deleted_at",null).not("founded_year","is",null)));
  console.log("pros RGE               :", await c("pros", q => q.eq("is_active",true).is("deleted_at",null).eq("is_rge",true)));
  console.log("pros reclames          :", await c("pros", q => q.not("claimed_by_user_id","is",null)));
})().catch(e => { console.error(e.message); process.exit(1); });
