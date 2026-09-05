import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // 1. Univers de pros joignables : actifs, non réclamés, avec un email non vide
  const { count: total } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null);
  const { count: withEmail } = await sb.from("pros").select("id", { count: "exact", head: true })
    .eq("is_active", true).is("deleted_at", null).not("email", "is", null).neq("email", "")
    .is("claimed_by_user_id", null).neq("do_not_contact", true);
  console.log(`Pros actifs total            : ${total}`);
  console.log(`Pros joignables par email    : ${withEmail}  (actifs, non réclamés, email non vide, contactables)`);
  console.log(`→ Couverture email           : ${total ? ((withEmail!/total!)*100).toFixed(2) : 0}%\n`);

  // 2. Où arrive la demande ? (15 derniers projets BTP : ville + dept + catégorie)
  const { data: projects } = await sb.from("projects")
    .select("id, category_id, broadcast_count, created_at, cities(name, postal_code, departments(code)), categories(name)")
    .eq("vertical", "btp").neq("status", "deleted")
    .order("created_at", { ascending: false }).limit(15);
  console.log("══ Demande (15 derniers projets BTP) · métier @ ville (dept) | broadcast ══");
  for (const p of projects || []) {
    const c = p.cities as { name?: string; postal_code?: string; departments?: { code?: string } } | null;
    const cat = (p.categories as { name?: string } | null)?.name || `cat#${p.category_id}`;
    console.log(`  #${p.id} ${String(cat).padEnd(22)} @ ${(c?.name||"?").padEnd(20)} (${c?.departments?.code||"?"}) | broadcast ${p.broadcast_count}×`);
  }

  // 3. Pour chaque dept de la demande : combien de pros joignables par email dans CE dept ?
  const depts = new Set<string>();
  for (const p of projects || []) {
    const code = ((p.cities as { departments?: { code?: string } } | null)?.departments?.code) || "";
    if (code) depts.add(code);
  }
  console.log("\n══ Pros joignables par email, par dept de la demande ══");
  for (const code of [...depts].sort()) {
    const { count } = await sb.from("pros").select("id", { count: "exact", head: true })
      .eq("is_active", true).is("deleted_at", null).not("email", "is", null).neq("email", "")
      .is("claimed_by_user_id", null).neq("do_not_contact", true)
      .like("postal_code", `${code.padStart(2,"0")}%`);
    console.log(`  Dept ${code.padStart(2," ")} : ${count} pros joignables par email`);
  }
}
main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });
