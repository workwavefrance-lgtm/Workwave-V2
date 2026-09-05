import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
(async () => {
  const sb = getServiceClient();
  const PAGE = 1000; let offset = 0; const all: any[] = [];
  while (true) {
    const { data, error } = await sb.from("price_guides").select("slug,scope,metier_slug,updated_at").range(offset, offset+PAGE-1);
    if (error) { console.error("ERR", error.message); process.exit(1); }
    const rows = data || []; if (rows.length === 0) break;
    all.push(...rows); offset += rows.length;
  }
  console.log(`price_guides en base : ${all.length}`);
  const parScope: Record<string,number> = {};
  for (const r of all) parScope[r.scope || "null"] = (parScope[r.scope||"null"]||0)+1;
  console.log("par scope :", JSON.stringify(parScope));
  const slugs = new Set(all.map(r=>r.slug));
  console.log(`slugs distincts : ${slugs.size}`);
  // dump pour comparaison sitemap
  require("fs").writeFileSync("/tmp/guides-db.txt", [...slugs].sort().join("\n"));
})().catch(e=>{console.error(e.message);process.exit(1);});
