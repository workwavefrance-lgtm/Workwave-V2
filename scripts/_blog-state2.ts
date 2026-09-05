import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
/* eslint-disable @typescript-eslint/no-explicit-any */
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  // colonnes réelles d'une row queue
  const { data: one } = await sb.from("blog_queue").select("*").limit(1);
  console.log("Colonnes blog_queue:", Object.keys((one || [{}])[0] || {}).join(", "));
  // statuts distincts + counts
  for (const s of ["pending", "generating", "generated", "failed", "done", "published"]) {
    const { count } = await sb.from("blog_queue").select("id", { count: "exact", head: true }).eq("status", s);
    if (count) console.log(`  status=${s}: ${count}`);
  }
  // les 2 failed récents : error_message
  const { data: fails } = await sb.from("blog_queue").select("id,error_message,generated_at,category_slug,city_slug").eq("status", "failed").order("id", { ascending: false }).limit(5);
  console.log("\n=== failed récents ===");
  (fails || []).forEach((f: any) => console.log(`  #${f.id} ${f.category_slug}/${f.city_slug} gen_at=${f.generated_at} err=${(f.error_message || "").slice(0, 140)}`));
  // dernier generated : quand ?
  const { data: lastGen } = await sb.from("blog_queue").select("id,generated_at,category_slug,city_slug").eq("status", "generated").order("generated_at", { ascending: false }).limit(3);
  console.log("\n=== derniers generated ===");
  (lastGen || []).forEach((g: any) => console.log(`  #${g.id} ${g.category_slug}/${g.city_slug} generated_at=${g.generated_at}`));
  // pending le plus prioritaire (celui que le cron prendrait demain)
  const { data: nextUp } = await sb.from("blog_queue").select("id,category_slug,city_slug,topic_type,priority,scheduled_at").eq("status", "pending").order("priority", { ascending: true }).order("scheduled_at", { ascending: true }).limit(3);
  console.log("\n=== prochains pending (ce que le cron prendrait) ===");
  (nextUp || []).forEach((n: any) => console.log(`  #${n.id} ${n.category_slug}/${n.city_slug} type=${n.topic_type} prio=${n.priority} sched=${n.scheduled_at}`));
})().catch((e) => console.error("ERR", e.message));
