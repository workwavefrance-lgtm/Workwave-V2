import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // All projects from last 24h with detail
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: projects } = await sb
    .from("projects")
    .select("id, vertical, category_id, status, first_name, email, description, created_at, deleted_at, ai_qualification")
    .gte("created_at", since)
    .order("id", { ascending: false });
  
  console.log(`Projets des dernieres 24h (${projects?.length || 0}) :`);
  for (const p of projects || []) {
    console.log(`\n--- Projet #${p.id} ---`);
    console.log(`  vertical: ${p.vertical}`);
    console.log(`  category_id: ${p.category_id}`);
    console.log(`  status: ${p.status}`);
    console.log(`  email: ${p.email}`);
    console.log(`  first_name: ${p.first_name}`);
    console.log(`  description (60 chars): ${(p.description || "").slice(0, 60)}`);
    console.log(`  deleted_at: ${p.deleted_at || "null"}`);
    console.log(`  created_at: ${p.created_at}`);
    if (p.ai_qualification) {
      const aq = p.ai_qualification as Record<string, unknown>;
      console.log(`  AI qual: suspicion_score=${aq.suspicion_score}, category=${aq.category}`);
    }
  }
}
main();
