import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
import { generateDepartmentSlug } from "../lib/utils/slugs";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => { const { data } = await sb.from("departments").select("*");
  console.log((data||[]).map((d:any)=>generateDepartmentSlug(d)).join("\n")); })();
