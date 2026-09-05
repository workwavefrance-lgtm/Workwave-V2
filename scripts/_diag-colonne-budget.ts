import { config } from "dotenv"; import path from "path";
import { createClient } from "@supabase/supabase-js";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
(async () => {
  const { data } = await sb.from("projects").select("id,budget").is("budget", null).limit(3);
  console.log("projets avec budget NULL :", (data||[]).length, (data||[]).map((p:any)=>p.id).join(", ") || "(aucun)");
})();
