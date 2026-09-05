import dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { getServiceClient } from "../lib/supabase/service-client";
const sb = getServiceClient();
(async () => {
  const { data } = await sb.from("blog_posts").select("slug,title,status,published_at").eq("status","published").not("published_at","is",null).order("id").range(0,999);
  const rows = (data||[]) as {slug:string;title:string}[];
  console.log("publies:", rows.length, "| slugs distincts:", new Set(rows.map(r=>r.slug)).size);
  const m = new Map<string,number>(); for (const r of rows) m.set(r.slug,(m.get(r.slug)||0)+1);
  console.log("doublons de slug:", [...m].filter(([,n])=>n>1).map(([s,n])=>`${s} x${n}`).join(" | ")||"aucun");
  // drafts
  const { data: d2 } = await sb.from("blog_posts").select("slug,title,created_at").eq("status","draft").order("id").range(0,999);
  console.log("\ndrafts:", (d2||[]).length);
  for (const r of (d2||[]).slice(0,50)) console.log("  -", (r as any).slug);
})();
