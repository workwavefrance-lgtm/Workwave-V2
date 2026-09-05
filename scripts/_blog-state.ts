import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
/* eslint-disable @typescript-eslint/no-explicit-any */
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { data: last } = await sb.from("blog_posts").select("slug,title,published_at,created_at").order("published_at", { ascending: false }).limit(5);
  console.log("=== 5 derniers blog_posts ===");
  (last || []).forEach((p: any) => console.log(`  ${p.published_at || p.created_at} · ${p.slug}`));
  const { count: total } = await sb.from("blog_posts").select("id", { count: "exact", head: true });
  console.log(`Total posts: ${total}`);
  const { data: queue } = await sb.from("blog_queue").select("*").order("id", { ascending: false }).limit(10);
  console.log(`\n=== blog_queue (10 dernières rows) ===`);
  (queue || []).forEach((q: any) => console.log(`  #${q.id} status=${q.status || "?"} topic=${(q.topic || q.title || q.keyword || JSON.stringify(q)).slice(0, 80)}`));
  const { count: qPending } = await sb.from("blog_queue").select("id", { count: "exact", head: true }).eq("status", "pending");
  const { count: qDone } = await sb.from("blog_queue").select("id", { count: "exact", head: true }).eq("status", "done");
  console.log(`Queue: pending=${qPending} done=${qDone}`);
})().catch((e) => console.error("ERR", e.message));
