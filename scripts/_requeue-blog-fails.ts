import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  // Requeue UNIQUEMENT les échecs techniques (modèle retiré + crédits), pas les catégories droppées
  const { data, error, count } = await sb
    .from("blog_queue")
    .update({ status: "pending", error_message: null } as never, { count: "exact" })
    .eq("status", "failed")
    .or("error_message.ilike.%not_found_error%,error_message.ilike.%credit balance%")
    .select("id");
  if (error) { console.error("❌ UPDATE ERROR:", error.message); process.exit(1); }
  console.log(`✅ ${count} items remis en pending:`, (data || []).map((r: { id: number }) => r.id).join(", "));
  // Vérif état final
  const { count: failedLeft } = await sb.from("blog_queue").select("id", { count: "exact", head: true }).eq("status", "failed");
  const { count: pending } = await sb.from("blog_queue").select("id", { count: "exact", head: true }).eq("status", "pending");
  console.log(`État final: pending=${pending}, failed restants=${failedLeft} (attendu: 2 = catégories droppées)`);
})();
