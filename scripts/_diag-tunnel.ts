import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
(async () => {
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const { data, error } = await sb.from("events").select("*").gte("created_at", since).limit(50000);
  if (error) return console.log("ERR events:", error.message);
  console.log("colonnes :", Object.keys((data||[])[0]||{}).join(", "));
  const key = Object.keys((data||[])[0]||{}).find((k)=>/name|event|type|action/i.test(k)) || "?";
  console.log("colonne utilisee :", key);
  const n: Record<string, number> = {};
  (data || []).forEach((e: any) => { const v = String(e[key]); n[v] = (n[v] || 0) + 1; });
  console.log("EVENEMENTS SUR 30 JOURS :");
  Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, v]) => console.log(`  ${String(v).padStart(7)}  ${k}`));
  if (!data?.length) console.log("  (table vide sur la periode)");
})();
