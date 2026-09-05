import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data } = await sb.from("blog_posts").select("slug,published_at,created_at").eq("status","published").order("published_at",{ascending:false}).limit(10);
  console.log("10 derniers articles publies :");
  for (const r of (data||[]) as any[]) console.log("  ", (r.published_at||"").slice(0,10), r.slug.slice(0,70));
  const now = Date.now();
  for (const j of [30, 90, 180, 365]) {
    const d = new Date(now - j*864e5).toISOString();
    const { count } = await sb.from("blog_posts").select("id",{count:"exact",head:true}).eq("status","published").gte("published_at", d);
    console.log(`publies depuis ${j} jours :`, count);
  }
  // queue : repartition topic_type et scheduled_at
  const { data: q } = await sb.from("blog_queue").select("topic_type,scheduled_at,priority,category_slug,city_slug").eq("status","pending").order("priority").limit(1000);
  const rows = (q||[]) as any[];
  const mt = new Map<string,number>(); for (const r of rows) mt.set(r.topic_type,(mt.get(r.topic_type)||0)+1);
  console.log("\nqueue pending (echantillon 1000) topic_type:", [...mt].map(([k,v])=>`${k}=${v}`).join(" "));
  const villes = rows.filter(r=>r.city_slug).length;
  console.log("dont avec city_slug:", villes, "/", rows.length);
  const mv = new Map<string,number>(); for (const r of rows) if (r.city_slug) mv.set(r.city_slug,(mv.get(r.city_slug)||0)+1);
  console.log("communes distinctes en queue (echantillon):", mv.size);
  console.log("top communes:", [...mv].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>`${k}=${v}`).join(" "));
})();
