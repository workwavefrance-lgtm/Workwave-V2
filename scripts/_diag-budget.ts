import { config } from "dotenv"; import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
(async () => {
  const { data } = await sb.from("projects").select("*").neq("status","deleted");
  const n: Record<string, number> = {};
  (data||[]).forEach((p:any)=>{ const v = (p.budget ?? p.budget_estimated ?? p.budget_range) ?? "vide"; n[v]=(n[v]||0)+1; });
  const tot = (data||[]).length;
  Object.entries(n).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`  ${String(v).padStart(3)}  ${Math.round(v*100/tot)}%  ${k}`));
  console.log(`  total ${tot}`);
})();
