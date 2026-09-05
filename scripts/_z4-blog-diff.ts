import dotenv from "dotenv"; import path from "path"; import fs from "fs";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data } = await sb.from("blog_posts").select("slug").eq("status","published").not("published_at","is",null).order("id").range(0,999);
  const db = new Set(((data||[]) as {slug:string}[]).map(r=>r.slug));
  const sm = new Set(fs.readFileSync("/tmp/sm_blog.txt","utf8").split("\n").filter(Boolean));
  console.log("db:", db.size, "sitemap:", sm.size);
  console.log("dans db PAS dans sitemap:", [...db].filter(s=>!sm.has(s)));
  console.log("dans sitemap PAS dans db:", [...sm].filter(s=>!db.has(s)));
})();
