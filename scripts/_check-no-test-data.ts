import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { data: projs } = await sb.from("projects")
    .select("id, first_name, email, status, created_at, categories(name), cities(name)")
    .order("created_at", { ascending: false }).limit(5);
  console.log("=== 5 derniers projets en base ===");
  for (const p of (projs || []) as any[]) {
    const suspect = /test/i.test(p.first_name || "") || /example\.invalid/i.test(p.email || "");
    console.log(`  #${p.id} ${p.first_name} | ${p.categories?.name} ${p.cities?.name} | ${p.status} | ${p.created_at?.slice(0,10)} ${suspect ? "  ⚠️ RESTE DU TEST" : ""}`);
  }
  const { data: tickets } = await sb.from("support_tickets").select("id, subject, requester_email");
  console.log(`\n=== tickets support en base : ${(tickets||[]).length} ===`);
  for (const t of (tickets || []) as any[]) {
    console.log(`  #${t.id} ${t.subject} | ${t.requester_email}`);
  }
  const leftovers = ((projs||[]) as any[]).filter(p => /test/i.test(p.first_name||"") || /example\.invalid/i.test(p.email||""));
  console.log("");
  if (leftovers.length === 0 && (tickets||[]).length === 0) console.log("✅ BASE PROPRE : aucune donnee de test residuelle.");
  else console.log("⚠️ Il reste des donnees de test a nettoyer.");
})();
