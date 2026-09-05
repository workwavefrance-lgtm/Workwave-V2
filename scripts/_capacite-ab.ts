import * as dotenv from "dotenv"; import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } });
(async () => {
  const { data, error } = await sb.from("events").select("*").limit(3);
  if (error) console.log("table events :", error.message);
  else {
    console.log("table events : accessible, colonnes =", Object.keys(data?.[0] || {}).join(", ") || "(vide)");
    console.log("exemple :", JSON.stringify(data?.[0] || {}).slice(0, 260));
  }
  // taux de reclamation historique, pour calculer la puissance du test
  const { data: rec } = await sb.from("pros").select("id, claimed_at")
    .not("claimed_at", "is", null).eq("is_active", true).limit(1000);
  console.log(`\nfiches reclamees au total : ${(rec || []).length}`);
})();
