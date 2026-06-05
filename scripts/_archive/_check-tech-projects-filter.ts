import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const result = await sb
    .from("projects")
    .select("id, vertical, category_id, status, first_name, email, deleted_at, created_at")
    .eq("vertical", "tech")
    .order("created_at", { ascending: false });

  console.log("Tech projects (no filter on deleted_at):");
  console.log(JSON.stringify(result.data, null, 2));

  // Simuler le filtre exact du dashboard projets/page.tsx
  const result2 = await sb
    .from("projects")
    .select("id, vertical, category_id, status, deleted_at")
    .eq("vertical", "tech")
    .is("deleted_at", null)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  console.log("\nAvec filtre dashboard (.is('deleted_at',null).neq('status','deleted')):");
  console.log(JSON.stringify(result2.data, null, 2));
}
main().catch((e) => console.error(e));
