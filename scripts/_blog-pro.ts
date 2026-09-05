import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const { data, error } = await sb.from("blog_posts").select("slug,title,status").eq("status","published").limit(1000);
  if (error) { console.log("ERR", error.message); return; }
  const rows = data || [];
  console.log(`articles publies : ${rows.length}`);
  const RE = /chantier|client|prospect|artisan|devis|se faire connaitre|visibilit|auto.?entrepreneur|tarif horaire|facturation|micro.?entreprise/i;
  const pro = rows.filter(r => RE.test(r.title) || RE.test(r.slug));
  console.log(`\n=== articles a angle PRO potentiel : ${pro.length} ===`);
  for (const r of pro) console.log(`   /blog/${r.slug}  ::  ${r.title}`);
})();
