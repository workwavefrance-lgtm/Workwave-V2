import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Sample of pros with skills not null
  const { data } = await sb
    .from("pros")
    .select("id, name, skills")
    .not("skills", "is", null)
    .limit(5);
  console.log("Sample skills (5 pros):");
  for (const p of data || []) {
    console.log(`  pro ${p.id}: typeof=${typeof p.skills}, value=${JSON.stringify(p.skills).slice(0, 100)}`);
  }
}
main();
