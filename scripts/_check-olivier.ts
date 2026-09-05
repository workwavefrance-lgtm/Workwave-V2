import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
  const email = "%oliviersurlenet%";
  // 1. Projets déposés avec cet email
  const { data: proj } = await sb.from("projects")
    .select("id, first_name, email, phone, status, created_at, description, categories(name), cities(name, departments(code))")
    .ilike("email", email).order("created_at", { ascending: false });
  console.log(`══ PROJETS déposés (${proj?.length || 0}) ══`);
  for (const p of proj || []) {
    const c = p.cities as any; const cat = (p.categories as any)?.name;
    console.log(`  #${p.id} [${p.status}] ${p.first_name} <${p.email}> tel:${p.phone||"-"} | ${cat} @ ${c?.name} (${c?.departments?.code}) | ${p.created_at?.slice(0,16)}`);
    console.log(`     desc: ${(p.description||"").slice(0,140)}`);
  }
  // 2. Est-il un pro (fiche) ?
  const { data: pro } = await sb.from("pros")
    .select("id, name, email, claimed_by_user_id, is_active")
    .ilike("email", email);
  console.log(`\n══ FICHE PRO avec cet email (${pro?.length || 0}) ══`);
  for (const p of pro || []) console.log(`  #${p.id} ${p.name} claimed=${p.claimed_by_user_id?"OUI":"non"} active=${p.is_active}`);
  if (!pro?.length) console.log("  Aucune : c'est un particulier, pas un pro.");
}
main().catch(e=>{console.error(e.message);process.exit(1);});
