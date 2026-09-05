import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
/* eslint-disable @typescript-eslint/no-explicit-any */
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { data: fails } = await sb.from("blog_queue")
    .select("id,category_slug,city_slug,error_message,created_at")
    .eq("status", "failed")
    .order("id", { ascending: false })
    .limit(24);
  console.log("=== 24 items failed (du plus récent au plus vieux) ===");
  (fails || []).forEach((f: any) =>
    console.log(`#${f.id} ${f.category_slug}/${f.city_slug || "-"} → ${(f.error_message || "(vide)").slice(0, 160)}`)
  );
})().catch((e) => console.error("ERR", e.message));
