import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  // pagination correcte
  const all: any[] = [];
  let offset = 0; const PAGE = 1000;
  while (true) {
    const { data, error } = await sb.from("blog_posts").select("slug,title,status,published_at,created_at").range(offset, offset+PAGE-1);
    if (error) { console.log("ERR", error.message); return; }
    const rows = data || [];
    if (rows.length === 0) break;
    all.push(...rows);
    offset += rows.length;
  }
  console.log(`TOTAL blog_posts (tous statuts) : ${all.length}`);
  const byStatus: Record<string, number> = {};
  for (const r of all) byStatus[r.status] = (byStatus[r.status]||0)+1;
  console.log("par statut :", JSON.stringify(byStatus));

  const leads = all.filter(r => /obtenir-leads-artisan/.test(r.slug));
  console.log(`\n=== articles slug obtenir-leads-artisan-* : ${leads.length} ===`);
  for (const r of leads) console.log(`  [${r.status}] /blog/${r.slug}  pub=${r.published_at?String(r.published_at).slice(0,10):"null"}  :: ${r.title}`);
})();
