import { config } from "dotenv"; import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
sb.from("categories").select("id, slug, vertical").in("id", [23,28,33,20,40,19,188,207,26,25,41,30]).order("id").then(({ data }) => console.log((data || []).map((c) => `${c.id}=${c.slug}(${c.vertical})`).join("  ")));
