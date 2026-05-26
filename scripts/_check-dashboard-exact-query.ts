import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const service = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // EXACT same query as projets/page.tsx (filter only, no JOIN first)
  const r1 = await service
    .from("projects")
    .select("id, description, status, vertical, deleted_at, category_id")
    .eq("vertical", "tech")
    .is("deleted_at", null)
    .neq("status", "deleted")
    .order("created_at", { ascending: false })
    .limit(50);
  console.log("Sans JOIN categories :");
  console.log("  error:", r1.error);
  console.log("  data length:", r1.data?.length);
  console.log("  IDs:", (r1.data || []).map(p => `#${p.id} (${p.status})`).join(", "));

  // Avec le JOIN categories comme dans le dashboard
  const r2 = await service
    .from("projects")
    .select("id, description, budget, urgency, status, created_at, ai_qualification, first_name, email, phone, category_id, categories(name, slug)")
    .eq("vertical", "tech")
    .is("deleted_at", null)
    .neq("status", "deleted")
    .order("created_at", { ascending: false })
    .limit(50);
  console.log("\nAvec JOIN categories(name, slug) :");
  console.log("  error:", r2.error);
  console.log("  data length:", r2.data?.length);
  console.log("  IDs:", (r2.data || []).map(p => `#${p.id} (cat=${JSON.stringify(p.categories)})`).join(", "));
}
main().catch((e) => console.error(e));
