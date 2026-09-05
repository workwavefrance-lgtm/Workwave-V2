import { config } from "dotenv";
import path from "path";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function main() {
  // Maçon = cat 3, Aveyron = CP 12xxx. Priorité aux fiches avec contact.
  const { data, error } = await sb.from("pros")
    .select("id, name, postal_code, email, phone, website, instagram, claimed_by_user_id, cities(name)")
    .eq("category_id", 3).eq("is_active", true).is("deleted_at", null)
    .like("postal_code", "12%").limit(60);
  if (error) { console.log("ERREUR", error.message); return; }
  const rows = data || [];
  const withC = rows.filter(p => p.email || p.phone || p.website || p.instagram);
  console.log(`MAÇONS Aveyron (12) en base : ${rows.length}, dont ${withC.length} avec contact.\n`);
  // Villecomtal=12580, prioriser le nord Aveyron (Espalion/Rodez/Bozouls/Estaing)
  const near = /^12(5|4|0|1|6)/;
  const sorted = rows.sort((a,b)=> (near.test(b.postal_code||"")?1:0)-(near.test(a.postal_code||"")?1:0));
  for (const p of sorted) {
    const c = (p.cities as any)?.name || "?";
    const bits = [p.instagram&&`IG:${p.instagram}`, p.website&&`web:${p.website}`, p.email&&`mail:${p.email}`, p.phone&&`tel:${p.phone}`].filter(Boolean).join(" ");
    console.log(`  ${(p.postal_code||"").padEnd(6)} ${(p.name||"").slice(0,34).padEnd(34)} ${c.padEnd(20)} ${bits||"(squelette)"}`);
  }
}
main().catch(e=>{console.error(e.message);process.exit(1);});
