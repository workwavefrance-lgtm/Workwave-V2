import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function show(label: string, rows: any[]) {
  console.log(`\n══ ${label} (${rows.length}) ══`);
  for (const p of rows) {
    const c = p.cities as any;
    console.log(`  #${p.id} [${p.status}] ${p.first_name} <${p.email}> | ${(p.categories as any)?.name} @ ${c?.name} (${c?.departments?.code}) | broadcast=${p.broadcast_count} | ${p.created_at?.slice(0,16)}`);
    console.log(`     desc: ${(p.description||"").slice(0,120)}`);
  }
}

async function main() {
  const sel = "id, first_name, email, status, description, broadcast_count, created_at, category_id, city_id, categories(name), cities(name, departments(code))";
  // 1. Apprentissage Bonnat (Catherine Delcroix / Andy Junior)
  const { data: a } = await sb.from("projects").select(sel)
    .neq("status", "deleted")
    .or("email.ilike.%delcroix%,description.ilike.%apprentissage%,description.ilike.%Andy Junior%");
  await show("Apprentissage / Bonnat", a || []);
  // 2. MB PLANS & PROJETS (Mohamed BOUKHARI, pro déposé par erreur)
  const { data: b } = await sb.from("projects").select(sel)
    .neq("status", "deleted")
    .or("email.ilike.%mb-plansprojets%,email.ilike.%boukhari%,first_name.ilike.%boukhari%,description.ilike.%MB PLANS%,first_name.ilike.%mohamed%");
  await show("MB PLANS / Mohamed BOUKHARI", b || []);
}
main().catch(e => { console.error(e.message); process.exit(1); });
