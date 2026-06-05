import dotenv from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Distribution des verticals dans la table projects
  const { data: projects } = await sb
    .from("projects")
    .select("id, vertical, category_id, status, created_at")
    .order("id", { ascending: false })
    .limit(20);
  console.log("Last 20 projects:");
  console.table(projects);

  // Distinct values
  const { data: distinct } = await sb
    .from("projects")
    .select("vertical")
    .order("vertical");
  const counts: Record<string, number> = {};
  for (const p of distinct || []) {
    counts[p.vertical || "NULL"] = (counts[p.vertical || "NULL"] || 0) + 1;
  }
  console.log("\nDistinct vertical values + counts:");
  console.table(counts);

  // Categories distinct
  const cats = new Set<number>();
  for (const p of distinct || []) {
    // skip
  }
  const { data: cats2 } = await sb
    .from("projects")
    .select("category_id")
    .order("category_id");
  const catCounts: Record<number, number> = {};
  for (const p of cats2 || []) {
    catCounts[p.category_id || -1] = (catCounts[p.category_id || -1] || 0) + 1;
  }
  console.log("\nDistinct category_id + counts (top 15):");
  const sorted = Object.entries(catCounts).sort(([, a], [, b]) => b - a).slice(0, 15);
  console.table(sorted);
}
main();
