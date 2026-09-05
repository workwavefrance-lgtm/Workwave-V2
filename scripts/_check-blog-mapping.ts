import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  // 1. Tous les articles blog avec "prix" dans le slug
  const { data: blogs } = await sb.from("blog_posts").select("slug,title,status").ilike("slug", "%prix%").order("slug");
  console.log("Articles blog 'prix' en base :", blogs?.length);
  for (const b of (blogs || []).slice(0, 25)) console.log(`  /blog/${b.slug}  [${b.status}]`);
}
main();
